import { useState, useEffect } from "react";
import { useScan } from "../hooks/useScan";
import { RiskLevel } from "../types";
import type { PolicyDTO } from "../types";
import * as api from "../services/api";
import { Scan, Sparkles, AlertTriangle, CircleCheck, ShieldAlert } from "lucide-react";

function getRiskClass(level: RiskLevel): string {
    switch (level) {
        case RiskLevel.LOW: return "risk-low";
        case RiskLevel.MEDIUM: return "risk-medium";
        case RiskLevel.HIGH: return "risk-high";
    }
}

function getRiskIcon(level: RiskLevel) {
    switch (level) {
        case RiskLevel.LOW: return <CircleCheck size={14} />;
        case RiskLevel.MEDIUM: return <AlertTriangle size={14} />;
        case RiskLevel.HIGH: return <ShieldAlert size={14} />;
    }
}

export function AIPlaygroundPage() {
    const { result, loading, error, scan, reset } = useScan();
    const [prompt, setPrompt] = useState("");
    const [policyId, setPolicyId] = useState("");
    const [policies, setPolicies] = useState<PolicyDTO[]>([]);

    useEffect(() => {
        api.getPolicies().then((p) => {
            setPolicies(p);
            if (p.length > 0 && !policyId) setPolicyId(p[0].id);
        });
    }, []);

    const handleScan = () => {
        if (!prompt.trim() || !policyId) return;
        scan(prompt, policyId);
    };

    return (
        <div className="playground-layout">
            {/* ── Left: Input Panel ──────────────── */}
            <div className="playground-input-panel">
                <div style={{ marginBottom: 24 }}>
                    <h1 className="page-title">Prompt Scanner</h1>
                    <p className="page-subtitle">Detect sensitive content before it reaches AI tools</p>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label htmlFor="policy-select" className="form-label">Security Policy</label>
                    <select
                        id="policy-select"
                        className="input-field"
                        value={policyId}
                        onChange={(e) => setPolicyId(e.target.value)}
                    >
                        {policies.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginTop: 20 }}>
                    <label htmlFor="prompt-input" className="form-label">Your Prompt</label>
                    <textarea
                        id="prompt-input"
                        className="input-field"
                        placeholder="Paste your prompt here to scan for sensitive data…"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        style={{ height: 220 }}
                    />
                </div>

                <div className="flex gap-3" style={{ marginTop: 20 }}>
                    <button
                        id="scan-button"
                        className="btn-primary"
                        onClick={handleScan}
                        disabled={loading || !prompt.trim()}
                    >
                        {loading ? <span className="spinner" /> : <Scan size={14} />}
                        {loading ? "Scanning…" : "Scan Prompt"}
                    </button>
                    {result && (
                        <button className="btn-secondary" onClick={() => { reset(); setPrompt(""); }}>
                            Clear
                        </button>
                    )}
                </div>

                {error && <div className="error-box animate-in mt-3">{error}</div>}
            </div>

            {/* ── Right: Results Panel ────────────── */}
            <div className="playground-results-panel">
                {!result && !loading && (
                    <div className="results-empty">
                        <div className="results-empty-icon">
                            <ShieldAlert size={32} />
                        </div>
                        <p className="results-empty-title">No scan results yet</p>
                        <p className="results-empty-sub">Enter a prompt and click "Scan Prompt" to check for sensitive data</p>
                    </div>
                )}

                {loading && (
                    <div className="results-empty">
                        <span className="spinner" style={{ width: 28, height: 28 }} />
                        <p className="results-empty-title" style={{ marginTop: 12 }}>Analyzing prompt…</p>
                    </div>
                )}

                {result && (
                    <div className="animate-in results-content">
                        {/* Risk verdict */}
                        <div className="result-section">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`risk-badge ${getRiskClass(result.riskLevel)}`}>
                                    {getRiskIcon(result.riskLevel)}
                                    {result.riskLevel} RISK
                                </span>
                                {result.categories.map((c) => (
                                    <span key={c} className="category-chip">{c}</span>
                                ))}
                            </div>
                            <p className="result-explanation">{result.explanation}</p>
                        </div>

                        {/* Detected entities */}
                        {result.detectedEntities.length > 0 && (
                            <div className="result-section">
                                <h3 className="section-title mb-2">
                                    Detected Entities
                                    <span className="category-chip">{result.detectedEntities.length}</span>
                                </h3>
                                <div className="entities-list">
                                    {result.detectedEntities.map((e, i) => (
                                        <div key={i} className="entity-row">
                                            <span className="entity-type">{e.type}</span>
                                            <code className="entity-value">{e.value}</code>
                                            <span className="entity-pos">pos {e.position}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested rewrite */}
                        {result.suggestedRewrite && (
                            <div className="result-section">
                                <h3 className="section-title mb-2">
                                    <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                                    Suggested Rewrite
                                </h3>
                                <div className="rewrite-block">{result.suggestedRewrite}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
