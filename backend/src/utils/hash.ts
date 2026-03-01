import crypto from "crypto";

/**
 * Compute a SHA-256 hash of the given text.
 * Used to store a fingerprint of prompts without retaining the raw content.
 */
export function hashPrompt(prompt: string): string {
    return crypto.createHash("sha256").update(prompt, "utf8").digest("hex");
}
