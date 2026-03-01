import axios from "axios";
import type {
    AuthResponse,
    ScanResponse,
    PolicyDTO,
    CreatePolicyInput,
    UpdatePolicyInput,
    AnalyticsSummary,
    TimelineDataPoint,
} from "../types";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    headers: { "Content-Type": "application/json" },
});

// ── JWT interceptor ─────────────────────────────────────

let token: string | null = null;

export function setToken(t: string | null): void {
    token = t;
}

api.interceptors.request.use((config) => {
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auth ────────────────────────────────────────────────

export async function login(
    email: string,
    password: string
): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/login", {
        email,
        password,
    });
    return data;
}

export async function logout(): Promise<void> {
    await api.post("/api/auth/logout");
}

// ── Scan ────────────────────────────────────────────────

export async function scanPrompt(
    prompt: string,
    policyId: string
): Promise<ScanResponse> {
    const { data } = await api.post<ScanResponse>("/api/scan", {
        prompt,
        policyId,
    });
    return data;
}

// ── Policies ────────────────────────────────────────────

export async function getPolicies(): Promise<PolicyDTO[]> {
    const { data } = await api.get<PolicyDTO[]>("/api/policies");
    return data;
}

export async function createPolicy(
    input: CreatePolicyInput
): Promise<PolicyDTO> {
    const { data } = await api.post<PolicyDTO>("/api/policies", input);
    return data;
}

export async function updatePolicy(
    id: string,
    input: UpdatePolicyInput
): Promise<PolicyDTO> {
    const { data } = await api.put<PolicyDTO>(`/api/policies/${id}`, input);
    return data;
}

// ── Analytics ───────────────────────────────────────────

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const { data } = await api.get<AnalyticsSummary>("/api/analytics/summary");
    return data;
}

export async function getAnalyticsTimeline(
    startDate?: string,
    endDate?: string
): Promise<TimelineDataPoint[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await api.get<TimelineDataPoint[]>(
        "/api/analytics/timeline",
        { params }
    );
    return data;
}
