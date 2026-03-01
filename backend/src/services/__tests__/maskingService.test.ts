import { describe, it, expect } from "vitest";
import { maskPrompt } from "../maskingService";
import type { DetectedEntity } from "../../models/types";

describe("MaskingService", () => {
    it("returns original prompt when no entities detected", () => {
        const result = maskPrompt({
            originalPrompt: "Hello world",
            detectedEntities: [],
        });
        expect(result.maskedPrompt).toBe("Hello world");
    });

    it("masks an email entity", () => {
        const entities: DetectedEntity[] = [
            { type: "email", value: "john@test.com", position: 12 },
        ];
        const result = maskPrompt({
            originalPrompt: "Contact me: john@test.com please",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Contact me: [EMAIL] please");
        expect(result.maskedPrompt).not.toContain("john@test.com");
    });

    it("masks a phone entity", () => {
        const entities: DetectedEntity[] = [
            { type: "phone", value: "555-123-4567", position: 8 },
        ];
        const result = maskPrompt({
            originalPrompt: "Call me 555-123-4567 today",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Call me [PHONE] today");
    });

    it("masks an SSN entity", () => {
        const entities: DetectedEntity[] = [
            { type: "ssn", value: "123-45-6789", position: 8 },
        ];
        const result = maskPrompt({
            originalPrompt: "My SSN: 123-45-6789",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("My SSN: [SSN]");
    });

    it("masks an API key entity", () => {
        const entities: DetectedEntity[] = [
            { type: "api_key", value: "sk-abcdef1234567890abcdef", position: 8 },
        ];
        const result = maskPrompt({
            originalPrompt: "Use key sk-abcdef1234567890abcdef here",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Use key [API_KEY] here");
    });

    it("masks a password entity", () => {
        const entities: DetectedEntity[] = [
            { type: "password", value: "password=MySecret123", position: 5 },
        ];
        const result = maskPrompt({
            originalPrompt: "Set: password=MySecret123 done",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Set: [PASSWORD] done");
    });

    it("masks an address entity", () => {
        const entities: DetectedEntity[] = [
            { type: "address", value: "123 Main St", position: 10 },
        ];
        const result = maskPrompt({
            originalPrompt: "Lives at: 123 Main St in town",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Lives at: [ADDRESS] in town");
    });

    it("masks a business_sensitive entity", () => {
        const entities: DetectedEntity[] = [
            { type: "business_sensitive", value: "revenue", position: 4 },
        ];
        const result = maskPrompt({
            originalPrompt: "Our revenue is growing",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Our [BUSINESS_DATA] is growing");
    });

    it("masks a custom_keyword entity", () => {
        const entities: DetectedEntity[] = [
            { type: "custom_keyword", value: "confidential", position: 8 },
        ];
        const result = maskPrompt({
            originalPrompt: "This is confidential info",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("This is [CUSTOM_DATA] info");
    });

    it("masks multiple entities in the same prompt", () => {
        const prompt = "Email john@test.com, SSN 123-45-6789";
        const entities: DetectedEntity[] = [
            { type: "email", value: "john@test.com", position: 6 },
            { type: "ssn", value: "123-45-6789", position: 25 },
        ];
        const result = maskPrompt({
            originalPrompt: prompt,
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Email [EMAIL], SSN [SSN]");
        expect(result.maskedPrompt).not.toContain("john@test.com");
        expect(result.maskedPrompt).not.toContain("123-45-6789");
    });

    it("handles overlapping entities by keeping the first non-overlapping spans", () => {
        // Simulate two entities where one overlaps another
        const entities: DetectedEntity[] = [
            { type: "email", value: "john@test.com", position: 0 },
            { type: "custom_keyword", value: "john", position: 0 },
        ];
        const result = maskPrompt({
            originalPrompt: "john@test.com is here",
            detectedEntities: entities,
        });
        // The longer match (email) should win
        expect(result.maskedPrompt).toBe("[EMAIL] is here");
    });

    it("masks an unknown entity type with [REDACTED]", () => {
        const entities: DetectedEntity[] = [
            { type: "unknown_type", value: "secret", position: 5 },
        ];
        const result = maskPrompt({
            originalPrompt: "Have secret data",
            detectedEntities: entities,
        });
        expect(result.maskedPrompt).toBe("Have [REDACTED] data");
    });
});
