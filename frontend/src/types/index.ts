
export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}


export interface DetectedEntity {
    type: string;
    value: string;
    position: number;
}

export interface ScanResponse {
    riskLevel: RiskLevel;
    categories: string[];
    detectedEntities: DetectedEntity[];
    explanation: string;
    suggestedRewrite: string | null;
}


export interface PolicyDTO {
    id: string;
    name: string;
    blockSecrets: boolean;
    warnOnPII: boolean;
    strictHealthTerms: boolean;
    customKeywords: string[];
    createdAt: string;
    updatedAt: string;
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
    timestamp: string;
    LOW: number;
    MEDIUM: number;
    HIGH: number;
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
