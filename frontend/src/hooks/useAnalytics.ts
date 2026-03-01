import { useState, useEffect, useCallback } from "react";
import type { AnalyticsSummary, TimelineDataPoint } from "../types";
import * as api from "../services/api";

interface UseAnalyticsReturn {
    summary: AnalyticsSummary | null;
    timeline: TimelineDataPoint[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [timeline, setTimeline] = useState<TimelineDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryData, timelineData] = await Promise.all([
                api.getAnalyticsSummary(),
                api.getAnalyticsTimeline(),
            ]);
            setSummary(summaryData);
            setTimeline(timelineData);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Failed to load analytics";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { summary, timeline, loading, error, refresh: fetchData };
}
