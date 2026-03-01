import { useState, useCallback } from "react";
import type { ScanResponse } from "../types";
import * as api from "../services/api";

interface UseScanReturn {
    result: ScanResponse | null;
    loading: boolean;
    error: string | null;
    scan: (prompt: string, policyId: string) => Promise<void>;
    reset: () => void;
}

export function useScan(): UseScanReturn {
    const [result, setResult] = useState<ScanResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scan = useCallback(async (prompt: string, policyId: string) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await api.scanPrompt(prompt, policyId);
            setResult(res);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Scan failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return { result, loading, error, scan, reset };
}
