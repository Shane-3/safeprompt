import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DetectedEntity } from "../../models/types";

// ── Mock Prisma ─────────────────────────────────────────

const mockPolicy = {
    id: "policy-1",
    name: "Test Policy",
    blockSecrets: true,
    warnOnPII: true,
    strictHealthTerms: false,
    customKeywords: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockCreate = vi.fn().mockResolvedValue({});
const mockFindUnique = vi.fn().mockResolvedValue(mockPolicy);

vi.mock("@prisma/client", () => {
    return {
        PrismaClient: class {
            policy = { findUnique: mockFindUnique };
            scanEvent = { create: mockCreate };
        },
    };
});

// ── Mock GeminiService ──────────────────────────────────

const mockRewriteWithGemini = vi.fn().mockResolvedValue("Rewritten safely");
vi.mock("../geminiService", () => ({
    rewriteWithGemini: (...args: unknown[]) => mockRewriteWithGemini(...args),
}));

// ── Import after mocks ─────────────────────────────────

const { scanPrompt } = await import("../scanService");

describe("ScanService — Privacy-First Flow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFindUnique.mockResolvedValue(mockPolicy);
        mockCreate.mockResolvedValue({});
        mockRewriteWithGemini.mockResolvedValue("Rewritten safely");
    });

    it("returns null suggestedRewrite for LOW risk prompts", async () => {
        const result = await scanPrompt(
            "Hello, please summarize this document",
            "policy-1",
            "user-1"
        );

        expect(result.riskLevel).toBe("LOW");
        expect(result.suggestedRewrite).toBeNull();
        expect(mockRewriteWithGemini).not.toHaveBeenCalled();
    });

    it("calls Gemini with maskedPrompt (not raw prompt) for MEDIUM/HIGH risk", async () => {
        const promptWithPII = "Email john@test.com about the meeting";

        const result = await scanPrompt(promptWithPII, "policy-1", "user-1");

        expect(result.riskLevel).not.toBe("LOW");
        expect(mockRewriteWithGemini).toHaveBeenCalledTimes(1);

        // First arg to rewriteWithGemini should be the MASKED prompt
        const maskedArg = mockRewriteWithGemini.mock.calls[0][0] as string;
        expect(maskedArg).not.toContain("john@test.com");
        expect(maskedArg).toContain("[EMAIL]");
    });

    it("never passes raw prompt to Gemini even with secrets", async () => {
        const promptWithSecret = "Use key sk-abcdefghij1234567890abcdef to access";

        const result = await scanPrompt(promptWithSecret, "policy-1", "user-1");

        expect(result.riskLevel).toBe("HIGH");
        expect(mockRewriteWithGemini).toHaveBeenCalledTimes(1);

        const maskedArg = mockRewriteWithGemini.mock.calls[0][0] as string;
        expect(maskedArg).not.toContain("sk-abcdefghij1234567890abcdef");
        expect(maskedArg).toContain("[API_KEY]");
    });

    it("passes detected entities to Gemini service for safety guard", async () => {
        const promptWithPII = "SSN is 123-45-6789";

        await scanPrompt(promptWithPII, "policy-1", "user-1");

        expect(mockRewriteWithGemini).toHaveBeenCalledTimes(1);
        const entitiesArg = mockRewriteWithGemini.mock.calls[0][1] as DetectedEntity[];
        expect(entitiesArg.length).toBeGreaterThan(0);
        expect(entitiesArg.some((e: DetectedEntity) => e.type === "ssn")).toBe(true);
    });

    it("stores only hash in scanEvent, never raw prompt", async () => {
        await scanPrompt("Email john@test.com about salary", "policy-1", "user-1");

        expect(mockCreate).toHaveBeenCalledTimes(1);
        const createArg = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
        const data = createArg.data;

        // Must have promptHash (a hex SHA-256)
        expect(data.promptHash).toBeDefined();
        expect(typeof data.promptHash).toBe("string");
        expect((data.promptHash as string).length).toBe(64); // SHA-256 hex length

        // Must NOT have any raw prompt field
        expect(data).not.toHaveProperty("prompt");
        expect(data).not.toHaveProperty("rawPrompt");
        expect(data).not.toHaveProperty("originalPrompt");
    });
});
