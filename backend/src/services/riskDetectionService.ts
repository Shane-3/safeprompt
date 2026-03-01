import type { DetectedEntity } from "../models/types";
import { RiskLevel } from "../models/types";


const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
    /(?:\+?1[-.\s])?\(?[2-9]\d{2}\)?[-.\s]\d{3}[-.\s]\d{4}/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const ADDRESS_REGEX =
    /\d{1,5}\s+(?:[A-Za-z]+\s){1,4}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Pl|Place|Way)\b/gi;


const API_KEY_PATTERNS = [
    /sk-[a-zA-Z0-9]{10,}/g,                            // OpenAI
    /AKIA[0-9A-Z]{16}/g,                               // AWS Access Key ID
    /sk_(?:live|test)_[a-zA-Z0-9]{8,}/g,               // Stripe
    /ghp_[a-zA-Z0-9]{20,}/g,                           // GitHub PAT
    /xox[bporas]-[a-zA-Z0-9-]{10,}/g,                  // Slack tokens
    /AIzaSy[a-zA-Z0-9_-]{30,}/g,                       // Google API keys
    /(?<=[=:\s])[A-Za-z0-9+\/]{40}(?=\s|$)/g,           // AWS Secret Access Key (40-char base64 after delimiter)
    /(?:mongodb(?:\+srv)?|postgresql|mysql|redis):\/\/[^\s]{10,}/gi,          // Database URLs with credentials
    /(?:[A-Z_]+(?:_KEY|_SECRET|_TOKEN|_PASSWORD))\s*[=:]\s*[^\s]{8,}/g,      // Generic env-style secrets
];
const BEARER_TOKEN_REGEX = /Bearer\s+[a-zA-Z0-9._\-]+/gi;
const PASSWORD_REGEX =
    /(?:password|passwd|pwd|secret)\s*[=:]\s*["']?[^\s"']{4,}/gi;


const BUSINESS_KEYWORDS = [
    "contract",
    "revenue",
    "salary",
    "customer list",
    "proprietary",
    "confidential",
    "merger",
    "acquisition",
    "patent",
];

// Keywords that escalate business-sensitive/custom matches → HIGH risk
const ESCALATE_TO_HIGH_KEYWORDS = [
    "confidential",
    "trade secret",
    "internal only",
    "restricted",
    "proprietary",
    "merger",
    "acquisition",
    "do not share",
    "classified",
    "top secret",
];


const HEALTH_KEYWORDS = [
    "patient",
    "diagnosis",
    "treatment",
    "medication",
    "medical record",
    "hipaa",
    "health record",
    "prescription",
    "symptom",
];


function matchAll(
    text: string,
    regex: RegExp,
    type: string
): DetectedEntity[] {
    const entities: DetectedEntity[] = [];
    // Reset regex index
    const re = new RegExp(regex.source, regex.flags);
    let match = re.exec(text);
    while (match !== null) {
        entities.push({
            type,
            value: match[0],
            position: match.index,
        });
        match = re.exec(text);
    }
    return entities;
}

function matchKeywords(
    text: string,
    keywords: string[],
    type: string
): DetectedEntity[] {
    const entities: DetectedEntity[] = [];
    const lower = text.toLowerCase();
    for (const kw of keywords) {
        let idx = lower.indexOf(kw.toLowerCase());
        while (idx !== -1) {
            entities.push({
                type,
                value: text.slice(idx, idx + kw.length),
                position: idx,
            });
            idx = lower.indexOf(kw.toLowerCase(), idx + 1);
        }
    }
    return entities;
}


// Deduplicate entities keeping longest match
function deduplicateEntities(entities: DetectedEntity[]): DetectedEntity[] {
    if (entities.length <= 1) return entities;

    // Sort by position and length
    const sorted = [...entities].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return b.value.length - a.value.length;
    });

    const result: DetectedEntity[] = [];
    let lastEnd = -1;

    for (const entity of sorted) {
        const entityEnd = entity.position + entity.value.length;
        // Skip contained matches
        if (entity.position < lastEnd) {
            continue;
        }
        result.push(entity);
        lastEnd = entityEnd;
    }

    return result;
}

export interface DetectionResult {
    entities: DetectedEntity[];
    categories: string[];
    hasPII: boolean;
    hasSecrets: boolean;
    hasBusinessSensitive: boolean;
    hasHealthTerms: boolean;
    hasCustomKeywords: boolean;
}

export interface PolicyConfig {
    blockSecrets: boolean;
    warnOnPII: boolean;
    strictHealthTerms: boolean;
    customKeywords: string[];
}

// Full risk detection pipeline
export function detectRisks(
    prompt: string,
    policy: PolicyConfig
): DetectionResult {
    const entities: DetectedEntity[] = [];
    const categories: string[] = [];

    const piiEntities = [
        ...matchAll(prompt, EMAIL_REGEX, "email"),
        ...matchAll(prompt, PHONE_REGEX, "phone"),
        ...matchAll(prompt, SSN_REGEX, "ssn"),
        ...matchAll(prompt, ADDRESS_REGEX, "address"),
    ];
    const hasPII = piiEntities.length > 0;
    if (hasPII) {
        entities.push(...piiEntities);
        categories.push("PII");
    }

    let secretEntities: DetectedEntity[] = [];
    for (const pattern of API_KEY_PATTERNS) {
        secretEntities.push(...matchAll(prompt, pattern, "api_key"));
    }
    secretEntities.push(...matchAll(prompt, BEARER_TOKEN_REGEX, "bearer_token"));
    secretEntities.push(...matchAll(prompt, PASSWORD_REGEX, "password"));

    // Deduplicate matches
    secretEntities = deduplicateEntities(secretEntities);

    const hasSecrets = secretEntities.length > 0;
    if (hasSecrets) {
        entities.push(...secretEntities);
        categories.push("Secrets");
    }

    const businessEntities = matchKeywords(
        prompt,
        BUSINESS_KEYWORDS,
        "business_sensitive"
    );
    const hasBusinessSensitive = businessEntities.length > 0;
    if (hasBusinessSensitive) {
        entities.push(...businessEntities);
        categories.push("Business-Sensitive");
    }

    let hasHealthTerms = false;
    if (policy.strictHealthTerms) {
        const healthEntities = matchKeywords(
            prompt,
            HEALTH_KEYWORDS,
            "health_term"
        );
        hasHealthTerms = healthEntities.length > 0;
        if (hasHealthTerms) {
            entities.push(...healthEntities);
            categories.push("Health");
        }
    }

    let hasCustomKeywords = false;
    if (policy.customKeywords.length > 0) {
        const customEntities = matchKeywords(
            prompt,
            policy.customKeywords,
            "custom_keyword"
        );
        hasCustomKeywords = customEntities.length > 0;
        if (hasCustomKeywords) {
            entities.push(...customEntities);
            if (!categories.includes("Custom")) {
                categories.push("Custom");
            }
        }
    }

    return {
        entities,
        categories,
        hasPII,
        hasSecrets,
        hasBusinessSensitive,
        hasHealthTerms,
        hasCustomKeywords,
    };
}

// Classify risk level based on detection results
export function classifyRisk(
    result: DetectionResult,
    policy: PolicyConfig
): RiskLevel {
    // Secrets + blockSecrets → HIGH
    if (result.hasSecrets && policy.blockSecrets) {
        return RiskLevel.HIGH;
    }

    // Business-sensitive or custom keywords that match escalation list → HIGH
    if (result.hasBusinessSensitive || result.hasCustomKeywords) {
        const sensitiveValues = result.entities
            .filter((e) => e.type === "business_sensitive" || e.type === "custom_keyword")
            .map((e) => e.value.toLowerCase());
        const shouldEscalate = ESCALATE_TO_HIGH_KEYWORDS.some((kw) =>
            sensitiveValues.some((v) => v.includes(kw) || kw.includes(v))
        );
        if (shouldEscalate) {
            return RiskLevel.HIGH;
        }
    }

    // PII or business-sensitive + warnOnPII → MEDIUM
    if (
        (result.hasPII || result.hasBusinessSensitive) &&
        policy.warnOnPII
    ) {
        return RiskLevel.MEDIUM;
    }

    // Custom keywords detected → MEDIUM
    if (result.hasCustomKeywords) {
        return RiskLevel.MEDIUM;
    }

    // Strict health terms → at least MEDIUM
    if (policy.strictHealthTerms && result.hasHealthTerms) {
        return RiskLevel.MEDIUM;
    }

    return RiskLevel.LOW;
}

// Generate explanation of scan findings
export function generateExplanation(
    result: DetectionResult,
    riskLevel: RiskLevel
): string {
    if (result.entities.length === 0) {
        return "No sensitive content detected. This prompt appears safe to send.";
    }

    const parts: string[] = [`Risk level: ${riskLevel}.`];

    if (result.hasPII) {
        const types = [...new Set(
            result.entities
                .filter((e) => ["email", "phone", "ssn", "address"].includes(e.type))
                .map((e) => e.type)
        )];
        parts.push(
            `Personally identifiable information detected (${types.join(", ")}).`
        );
    }

    if (result.hasSecrets) {
        parts.push(
            "Secrets or credentials detected — these should never be shared with AI tools."
        );
    }

    if (result.hasBusinessSensitive) {
        parts.push("Business-sensitive keywords detected.");
    }

    if (result.hasHealthTerms) {
        parts.push(
            "Health-related terms detected — extra caution required under health data policies."
        );
    }

    if (result.hasCustomKeywords) {
        parts.push("Custom policy keywords detected.");
    }

    parts.push(
        `Found ${result.entities.length} sensitive item(s) across ${result.categories.length} category(ies).`
    );

    return parts.join(" ");
}
