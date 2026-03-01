import crypto from "crypto";

// Compute SHA-256 hash of text
export function hashPrompt(prompt: string): string {
    return crypto.createHash("sha256").update(prompt, "utf8").digest("hex");
}
