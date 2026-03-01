export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}

// ── Scan ────────────────────────────────────────────────

export interface ScanRequest {
    prompt: string;
    policyId: string;
}

export interface DetectedEntity {
    type: string; // "email", "phone", "ssn", "api_key", etc.
    value: string;
    position: number; // character index in the original prompt
}

export interface ScanResponse {
    riskLevel: RiskLevel;
    categories: string[];
    detectedEntities: DetectedEntity[];
    explanation: string;
    suggestedRewrite: string | null;
}

// ── Masking ─────────────────────────────────────────────

export interface MaskingInput {
    originalPrompt: string;
    detectedEntities: DetectedEntity[];
}

export interface MaskingOutput {
    maskedPrompt: string;
}

// ── Policy ──────────────────────────────────────────────

export interface PolicyDTO {
    id: string;
    name: string;
    blockSecrets: boolean;
    warnOnPII: boolean;
    strictHealthTerms: boolean;
    customKeywords: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePolicyInput {
    name: string;
    blockSecrets: boolean;
    warnOnPII: boolean;
    strictHealthTerms: boolean;
    customKeywords: string[];
}

export interface UpdatePolicyInput {
    name?: string;
    blockSecrets?: boolean;
    warnOnPII?: boolean;
    strictHealthTerms?: boolean;
    customKeywords?: string[];
}

// ── Analytics ───────────────────────────────────────────

export interface RiskDistribution {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
}

export interface CategoryCount {
    category: string;
    count: number;
}

export interface AnalyticsSummary {
    totalScans: number;
    riskDistribution: RiskDistribution;
    topCategories: CategoryCount[];
}

export interface TimelineDataPoint {
    timestamp: string; // ISO date string (day bucket)
    LOW: number;
    MEDIUM: number;
    HIGH: number;
}

// ── Auth ────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    role: Role;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}

// ── Error ───────────────────────────────────────────────

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
}

// ── Express extension ───────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
