import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DetectedEntity } from "../models/types";


const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SECRET_PATTERNS = [
    /sk-[a-zA-Z0-9]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /sk_(?:live|test)_[a-zA-Z0-9]{24,}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /xox[bporas]-[a-zA-Z0-9-]{10,}/,
    /Bearer\s+[a-zA-Z0-9._\-]+/i,
    /(?:password|passwd|pwd|secret)\s*[=:]\s*["']?[^\s"']{4,}/i,
];

const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/;

const SYSTEM_INSTRUCTION =
    "You are a security-focused prompt rewriter. The prompt provided has already been sanitized. " +
    "Improve clarity while preserving task intent. Do not reintroduce sensitive data. " +
    "Return only the rewritten prompt.";

const GENERIC_FALLBACK =
    "Rewrite your prompt without including personal or confidential data.";


const DEFAULT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
];

// Parse model list from environment
function getModelCascade(): string[] {
    const modelsEnv = process.env.GEMINI_MODELS;
    if (modelsEnv) {
        return modelsEnv
            .split(",")
            .map((m) => m.trim())
            .filter((m) => m.length > 0);
    }

    const singleModel = process.env.GEMINI_MODEL;
    if (singleModel && singleModel !== "gemini-1.5-flash") {
        return [singleModel, ...DEFAULT_MODELS.filter((m) => m !== singleModel)];
    }

    return DEFAULT_MODELS;
}


// Check if rate-limit error
function isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return (
            msg.includes("429") ||
            msg.includes("rate limit") ||
            msg.includes("quota") ||
            msg.includes("resource exhausted") ||
            msg.includes("too many requests")
        );
    }
    return false;
}


// Pre-send safety guard
function isSafeToSend(
    maskedPrompt: string,
    detectedEntities: DetectedEntity[]
): boolean {
    // Check for residual raw entity values
    for (const entity of detectedEntities) {
        if (maskedPrompt.includes(entity.value)) {
            return false;
        }
    }

    // Check for email pattern
    if (EMAIL_REGEX.test(maskedPrompt)) {
        return false;
    }

    // Check for SSN pattern
    if (SSN_REGEX.test(maskedPrompt)) {
        return false;
    }

    // Check for secret patterns
    for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(maskedPrompt)) {
            return false;
        }
    }

    return true;
}


// Rewrite masked prompt using Gemini
export async function rewriteWithGemini(
    maskedPrompt: string,
    detectedEntities: DetectedEntity[],
    policyContext: string
): Promise<string> {
    if (!isSafeToSend(maskedPrompt, detectedEntities)) {
        console.warn("[GeminiService] Safety guard triggered — returning generic fallback");
        return GENERIC_FALLBACK;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your-gemini-api-key-here") {
        return fallbackRewrite(maskedPrompt);
    }

    const models = getModelCascade();
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Sanitized prompt: ${maskedPrompt}\nPolicy context: ${policyContext}`;

    for (let i = 0; i < models.length; i++) {
        const modelName = models[i];
        try {
            const geminiModel = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_INSTRUCTION,
            });

            const result = await geminiModel.generateContent(prompt);
            const text = result.response.text().trim();

            if (text) {
                if (i > 0) {
                    console.info(`[GeminiService] Succeeded with fallback model: ${modelName}`);
                }
                return text;
            }
        } catch (error) {
            if (isRateLimitError(error) && i < models.length - 1) {
                console.warn(
                    `[GeminiService] Model "${modelName}" rate-limited, trying "${models[i + 1]}"…`
                );
                continue;
            }

            // Non-rate-limit error or last model — give up
            console.error(
                `[GeminiService] Model "${modelName}" failed:`,
                error instanceof Error ? error.message : error
            );
            break;
        }
    }

    return fallbackRewrite(maskedPrompt);
}


// Returns masked prompt as fallback rewrite
function fallbackRewrite(maskedPrompt: string): string {
    return maskedPrompt;
}


export { isSafeToSend as _isSafeToSend };
