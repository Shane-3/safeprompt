import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DetectedEntity } from "../models/types";

// ── Safety patterns ─────────────────────────────────────

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

// ── Default model cascade (best free-tier models, ordered by preference) ──

const DEFAULT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
];

/**
 * Parse the model list from GEMINI_MODELS env var (comma-separated)
 * or fall back to GEMINI_MODEL (single) or the default cascade.
 */
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

// ── Rate-limit detection ────────────────────────────────

/**
 * Check if an error is a rate-limit (HTTP 429) or quota-exhausted error.
 */
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

// ── Safety guard ────────────────────────────────────────

/**
 * Pre-send safety check: ensure `maskedPrompt` contains no residual
 * sensitive data before it reaches the external LLM.
 *
 * Returns `true` if the prompt is safe to send.
 */
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

// ── Gemini rewrite ──────────────────────────────────────

/**
 * Rewrite a **masked** prompt using Google Gemini.
 *
 * Tries each model in the cascade. If a model hits a rate limit (429),
 * it automatically falls through to the next model. This ensures
 * free-tier limits are maximized across multiple models.
 *
 * This function NEVER receives the original raw prompt.
 * A pre-send safety guard validates the input before any API call.
 *
 * @param maskedPrompt     - The prompt with sensitive spans already replaced by tokens
 * @param detectedEntities - The entities that were masked (used for safety guard)
 * @param policyContext    - Human-readable policy summary for the LLM
 */
export async function rewriteWithGemini(
    maskedPrompt: string,
    detectedEntities: DetectedEntity[],
    policyContext: string
): Promise<string> {
    // ── Safety guard ────────────────────────────────────
    if (!isSafeToSend(maskedPrompt, detectedEntities)) {
        console.warn("[GeminiService] Safety guard triggered — returning generic fallback");
        return GENERIC_FALLBACK;
    }

    // ── API key check ───────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your-gemini-api-key-here") {
        return fallbackRewrite(maskedPrompt);
    }

    // ── Try each model in the cascade ───────────────────
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

// ── Fallback ────────────────────────────────────────────

/**
 * Simple fallback that returns the already-masked prompt as the rewrite.
 * Since masking has already been applied, this is safe.
 */
function fallbackRewrite(maskedPrompt: string): string {
    return maskedPrompt;
}

// ── Exported for testing ────────────────────────────────

export { isSafeToSend as _isSafeToSend };
