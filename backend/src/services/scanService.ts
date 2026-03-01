import { PrismaClient } from "@prisma/client";
import { hashPrompt } from "../utils/hash";
import {
    detectRisks,
    classifyRisk,
    generateExplanation,
} from "./riskDetectionService";
import { maskPrompt } from "./maskingService";
import { rewriteWithGemini } from "./geminiService";
import { AppError } from "../middleware/errorHandler";
import type { ScanResponse } from "../models/types";
import { RiskLevel } from "../models/types";

const prisma = new PrismaClient();

/**
 * Full scan pipeline (privacy-first):
 * 1. Fetch the policy
 * 2. Run risk detection on the prompt
 * 3. Classify risk level
 * 4. Generate human-readable explanation
 * 5. Mask detected entities
 * 6. If MEDIUM/HIGH → send ONLY maskedPrompt to Gemini for rewrite
 * 7. Store a ScanEvent (SHA-256 hash only — NO raw prompt)
 * 8. Return the response
 */
export async function scanPrompt(
    prompt: string,
    policyId: string,
    userId: string
): Promise<ScanResponse> {
    // 1. Fetch policy
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) {
        throw new AppError("Policy not found", 404);
    }

    // 2. Detect risks
    const detection = detectRisks(prompt, {
        blockSecrets: policy.blockSecrets,
        warnOnPII: policy.warnOnPII,
        strictHealthTerms: policy.strictHealthTerms,
        customKeywords: policy.customKeywords,
    });

    // 3. Classify
    const riskLevel = classifyRisk(detection, {
        blockSecrets: policy.blockSecrets,
        warnOnPII: policy.warnOnPII,
        strictHealthTerms: policy.strictHealthTerms,
        customKeywords: policy.customKeywords,
    });

    // 4. Explanation
    const explanation = generateExplanation(detection, riskLevel);

    // 5. Mask detected entities
    const { maskedPrompt } = maskPrompt({
        originalPrompt: prompt,
        detectedEntities: detection.entities,
    });

    // 6. Rewrite (only for MEDIUM / HIGH — uses maskedPrompt, NEVER raw prompt)
    let suggestedRewrite: string | null = null;
    if (riskLevel === RiskLevel.MEDIUM || riskLevel === RiskLevel.HIGH) {
        const policyContext = `Policy "${policy.name}": blockSecrets=${policy.blockSecrets}, warnOnPII=${policy.warnOnPII}, strictHealthTerms=${policy.strictHealthTerms}`;
        suggestedRewrite = await rewriteWithGemini(
            maskedPrompt,
            detection.entities,
            policyContext
        );
    }

    // 7. Persist scan event (hash only — no raw prompt)
    const promptHash = hashPrompt(prompt);
    await prisma.scanEvent.create({
        data: {
            promptHash,
            riskLevel,
            categories: detection.categories,
            policyId: policy.id,
            userId,
        },
    });

    // 8. Response
    return {
        riskLevel,
        categories: detection.categories,
        detectedEntities: detection.entities,
        explanation,
        suggestedRewrite,
    };
}
