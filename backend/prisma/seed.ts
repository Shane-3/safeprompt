import { PrismaClient, Role, RiskLevel } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    console.log("🌱 Seeding database…");

    // ── 1. Demo users ───────────────────────────────────

    const adminHash = await bcrypt.hash("admin123", SALT_ROUNDS);
    const userHash = await bcrypt.hash("demo123", SALT_ROUNDS);

    const admin = await prisma.user.upsert({
        where: { email: "admin@demo.com" },
        update: {},
        create: {
            email: "admin@demo.com",
            passwordHash: adminHash,
            role: Role.ADMIN,
        },
    });

    const user = await prisma.user.upsert({
        where: { email: "user@demo.com" },
        update: {},
        create: {
            email: "user@demo.com",
            passwordHash: userHash,
            role: Role.USER,
        },
    });

    console.log("  ✔ Demo users created");

    // ── 2. Default policies ─────────────────────────────

    const startupPolicy = await prisma.policy.upsert({
        where: { name: "Startup Default" },
        update: {},
        create: {
            name: "Startup Default",
            blockSecrets: true,
            warnOnPII: true,
            strictHealthTerms: false,
            customKeywords: [],
        },
    });

    const healthPolicy = await prisma.policy.upsert({
        where: { name: "Health Strict" },
        update: {},
        create: {
            name: "Health Strict",
            blockSecrets: true,
            warnOnPII: true,
            strictHealthTerms: true,
            customKeywords: [
                "patient",
                "diagnosis",
                "treatment",
                "medication",
                "medical record",
            ],
        },
    });

    const enterprisePolicy = await prisma.policy.upsert({
        where: { name: "Enterprise Confidential" },
        update: {},
        create: {
            name: "Enterprise Confidential",
            blockSecrets: true,
            warnOnPII: true,
            strictHealthTerms: false,
            customKeywords: [
                "confidential",
                "proprietary",
                "trade secret",
                "internal only",
                "restricted",
            ],
        },
    });

    console.log("  ✔ Default policies created");

    // ── 3. Sample scan events (for analytics demo) ──────

    const now = new Date();
    const sampleEvents = [
        { days: 0, risk: RiskLevel.HIGH, cats: ["Secrets", "PII"], policy: startupPolicy.id, userId: user.id },
        { days: 0, risk: RiskLevel.MEDIUM, cats: ["PII"], policy: startupPolicy.id, userId: user.id },
        { days: 0, risk: RiskLevel.LOW, cats: [], policy: startupPolicy.id, userId: admin.id },
        { days: 1, risk: RiskLevel.HIGH, cats: ["Secrets"], policy: enterprisePolicy.id, userId: user.id },
        { days: 1, risk: RiskLevel.MEDIUM, cats: ["Business-Sensitive"], policy: enterprisePolicy.id, userId: admin.id },
        { days: 1, risk: RiskLevel.LOW, cats: [], policy: startupPolicy.id, userId: user.id },
        { days: 2, risk: RiskLevel.MEDIUM, cats: ["PII", "Business-Sensitive"], policy: startupPolicy.id, userId: user.id },
        { days: 2, risk: RiskLevel.LOW, cats: [], policy: healthPolicy.id, userId: admin.id },
        { days: 3, risk: RiskLevel.HIGH, cats: ["Secrets", "PII"], policy: healthPolicy.id, userId: user.id },
        { days: 3, risk: RiskLevel.MEDIUM, cats: ["Health"], policy: healthPolicy.id, userId: admin.id },
        { days: 3, risk: RiskLevel.LOW, cats: [], policy: startupPolicy.id, userId: user.id },
        { days: 4, risk: RiskLevel.MEDIUM, cats: ["Custom"], policy: enterprisePolicy.id, userId: user.id },
        { days: 4, risk: RiskLevel.LOW, cats: [], policy: startupPolicy.id, userId: admin.id },
        { days: 5, risk: RiskLevel.HIGH, cats: ["Secrets"], policy: startupPolicy.id, userId: user.id },
        { days: 5, risk: RiskLevel.MEDIUM, cats: ["PII"], policy: startupPolicy.id, userId: user.id },
        { days: 5, risk: RiskLevel.LOW, cats: [], policy: healthPolicy.id, userId: admin.id },
        { days: 6, risk: RiskLevel.LOW, cats: [], policy: startupPolicy.id, userId: user.id },
        { days: 6, risk: RiskLevel.MEDIUM, cats: ["Business-Sensitive"], policy: enterprisePolicy.id, userId: admin.id },
    ];

    for (const s of sampleEvents) {
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - s.days);
        await prisma.scanEvent.create({
            data: {
                promptHash: `demo-hash-${Math.random().toString(36).slice(2, 10)}`,
                riskLevel: s.risk,
                categories: s.cats,
                policyId: s.policy,
                userId: s.userId,
                createdAt,
            },
        });
    }

    console.log("  ✔ Sample scan events created");
    console.log("✅ Seed complete!");
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
