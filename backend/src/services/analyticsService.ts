import { PrismaClient, RiskLevel } from "@prisma/client";
import type {
    AnalyticsSummary,
    TimelineDataPoint,
} from "../models/types";

const prisma = new PrismaClient();

// Get aggregate summary
export async function getSummary(): Promise<AnalyticsSummary> {
    // Total scans
    const totalScans = await prisma.scanEvent.count();

    // Risk distribution
    const groups = await prisma.scanEvent.groupBy({
        by: ["riskLevel"],
        _count: { riskLevel: true },
    });

    const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const g of groups) {
        riskDistribution[g.riskLevel as keyof typeof riskDistribution] = g._count.riskLevel;
    }

    // Top risk categories — flatten the categories arrays and count
    const allEvents = await prisma.scanEvent.findMany({
        select: { categories: true },
    });

    const categoryMap = new Map<string, number>();
    for (const event of allEvents) {
        for (const cat of event.categories) {
            categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
        }
    }

    const topCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return { totalScans, riskDistribution, topCategories };
}

// Get risk counts timeline
export async function getTimeline(
    startDate?: string,
    endDate?: string
): Promise<TimelineDataPoint[]> {
    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
        const createdAt: Record<string, Date> = {};
        if (startDate) createdAt.gte = new Date(startDate);
        if (endDate) createdAt.lte = new Date(endDate);
        where.createdAt = createdAt;
    }

    const events = await prisma.scanEvent.findMany({
        where,
        select: { createdAt: true, riskLevel: true },
        orderBy: { createdAt: "asc" },
    });

    // Bucket by day
    const buckets = new Map<
        string,
        { LOW: number; MEDIUM: number; HIGH: number }
    >();

    for (const e of events) {
        const day = e.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
        if (!buckets.has(day)) {
            buckets.set(day, { LOW: 0, MEDIUM: 0, HIGH: 0 });
        }
        const bucket = buckets.get(day)!;
        const key = e.riskLevel as keyof typeof bucket;
        bucket[key]++;
    }

    return Array.from(buckets.entries()).map(([timestamp, counts]) => ({
        timestamp,
        ...counts,
    }));
}
