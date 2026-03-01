import { describe, it, expect } from "vitest";
import { _isSafeToSend } from "../geminiService";
import type { DetectedEntity } from "../../models/types";

describe("GeminiService — Safety Guard", () => {
    it("returns true for a fully masked prompt with no residual sensitive data", () => {
        const entities: DetectedEntity[] = [
            { type: "email", value: "john@test.com", position: 6 },
        ];
        const maskedPrompt = "Email [EMAIL] please";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(true);
    });

    it("returns false when maskedPrompt still contains a raw entity value", () => {
        const entities: DetectedEntity[] = [
            { type: "email", value: "john@test.com", position: 6 },
        ];
        // Simulate masking failure
        const maskedPrompt = "Email john@test.com please";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(false);
    });

    it("returns false when maskedPrompt contains an email pattern", () => {
        const entities: DetectedEntity[] = [];
        const maskedPrompt = "Send to alice@example.org today";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(false);
    });

    it("returns false when maskedPrompt contains an SSN pattern", () => {
        const entities: DetectedEntity[] = [];
        const maskedPrompt = "Number is 123-45-6789 here";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(false);
    });

    it("returns false when maskedPrompt contains an API key pattern", () => {
        const entities: DetectedEntity[] = [];
        const maskedPrompt = "Key: sk-abcdefghij1234567890abcdef";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(false);
    });

    it("returns false when maskedPrompt contains a password pattern", () => {
        const entities: DetectedEntity[] = [];
        const maskedPrompt = "Config: password=SuperSecret123";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(false);
    });

    it("returns false when maskedPrompt contains a Bearer token", () => {
        const entities: DetectedEntity[] = [];
        const maskedPrompt = "Auth: Bearer eyJhbGciOiJIUzI1NiJ9.token";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(false);
    });

    it("returns true for a clean prompt with mask tokens only", () => {
        const entities: DetectedEntity[] = [
            { type: "email", value: "john@test.com", position: 6 },
            { type: "ssn", value: "123-45-6789", position: 25 },
        ];
        const maskedPrompt = "Email [EMAIL], SSN [SSN] review";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(true);
    });

    it("returns true for a prompt with no entities and no sensitive patterns", () => {
        const entities: DetectedEntity[] = [];
        const maskedPrompt = "Please summarize this document for me";
        expect(_isSafeToSend(maskedPrompt, entities)).toBe(true);
    });
});
