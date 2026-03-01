import type { MaskingInput, MaskingOutput, DetectedEntity } from "../models/types";


const MASK_MAP: Record<string, string> = {
    email: "[EMAIL]",
    phone: "[PHONE]",
    ssn: "[SSN]",
    api_key: "[API_KEY]",
    bearer_token: "[API_KEY]",
    password: "[PASSWORD]",
    address: "[ADDRESS]",
    business_sensitive: "[BUSINESS_DATA]",
    health_term: "[BUSINESS_DATA]",
    custom_keyword: "[CUSTOM_DATA]",
};

// Get deterministic mask token
function getMaskToken(entityType: string): string {
    return MASK_MAP[entityType] ?? "[REDACTED]";
}

// Deduplicate overlapping entities
function deduplicateAndSort(entities: DetectedEntity[]): DetectedEntity[] {
    // Sort ascending by position first, then descending by value length (longer wins)
    const sorted = [...entities].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return b.value.length - a.value.length;
    });

    const result: DetectedEntity[] = [];
    let lastEnd = -1;

    for (const entity of sorted) {
        const entityEnd = entity.position + entity.value.length;
        // Skip if this entity is fully contained within a previous one
        if (entity.position < lastEnd) {
            continue;
        }
        result.push(entity);
        lastEnd = entityEnd;
    }

    // Reverse so we replace from end-of-string first (preserves earlier indices)
    return result.reverse();
}

// Replace sensitive spans with mask tokens
export function maskPrompt(input: MaskingInput): MaskingOutput {
    if (input.detectedEntities.length === 0) {
        return { maskedPrompt: input.originalPrompt };
    }

    const entities = deduplicateAndSort(input.detectedEntities);
    let masked = input.originalPrompt;

    for (const entity of entities) {
        const before = masked.slice(0, entity.position);
        const after = masked.slice(entity.position + entity.value.length);
        masked = before + getMaskToken(entity.type) + after;
    }

    return { maskedPrompt: masked };
}
