import { z } from "zod";

// ── Auth schemas ────────────────────────────────────────

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

// ── Scan schemas ────────────────────────────────────────

export const scanSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    policyId: z.string().min(1, "Policy ID is required"),
});

// ── Policy schemas ──────────────────────────────────────

export const createPolicySchema = z.object({
    name: z.string().min(1, "Policy name is required"),
    blockSecrets: z.boolean(),
    warnOnPII: z.boolean(),
    strictHealthTerms: z.boolean(),
    customKeywords: z.array(z.string()).default([]),
});

export const updatePolicySchema = z.object({
    name: z.string().min(1).optional(),
    blockSecrets: z.boolean().optional(),
    warnOnPII: z.boolean().optional(),
    strictHealthTerms: z.boolean().optional(),
    customKeywords: z.array(z.string()).optional(),
});

// ── Analytics schemas ───────────────────────────────────

export const timelineQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});
