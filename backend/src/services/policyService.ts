import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import type {
    PolicyDTO,
    CreatePolicyInput,
    UpdatePolicyInput,
} from "../models/types";

const prisma = new PrismaClient();

let policyCache: PolicyDTO[] | null = null;

function invalidateCache(): void {
    policyCache = null;
}

function toDTO(p: {
    id: string;
    name: string;
    blockSecrets: boolean;
    warnOnPII: boolean;
    strictHealthTerms: boolean;
    customKeywords: string[];
    createdAt: Date;
    updatedAt: Date;
}): PolicyDTO {
    return {
        id: p.id,
        name: p.name,
        blockSecrets: p.blockSecrets,
        warnOnPII: p.warnOnPII,
        strictHealthTerms: p.strictHealthTerms,
        customKeywords: p.customKeywords,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    };
}

// List all policies
export async function getAllPolicies(): Promise<PolicyDTO[]> {
    if (policyCache) return policyCache;

    const rows = await prisma.policy.findMany({
        orderBy: { createdAt: "asc" },
    });
    const result = rows.map(toDTO);
    policyCache = result;
    return result;
}

// Get policy by ID
export async function getPolicyById(id: string): Promise<PolicyDTO> {
    const row = await prisma.policy.findUnique({ where: { id } });
    if (!row) throw new AppError("Policy not found", 404);
    return toDTO(row);
}

// Create policy
export async function createPolicy(
    input: CreatePolicyInput
): Promise<PolicyDTO> {
    const row = await prisma.policy.create({ data: input });
    invalidateCache();
    return toDTO(row);
}

// Update policy
export async function updatePolicy(
    id: string,
    input: UpdatePolicyInput
): Promise<PolicyDTO> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new AppError("Policy not found", 404);

    const row = await prisma.policy.update({
        where: { id },
        data: input,
    });
    invalidateCache();
    return toDTO(row);
}
