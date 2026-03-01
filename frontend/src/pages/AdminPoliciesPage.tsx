import { useState, useEffect } from "react";
import type { PolicyDTO, CreatePolicyInput } from "../types";
import * as api from "../services/api";
import { Plus, X } from "lucide-react";

export function AdminPoliciesPage() {
    const [policies, setPolicies] = useState<PolicyDTO[]>([]);
    const [editing, setEditing] = useState<PolicyDTO | null>(null);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [blockSecrets, setBlockSecrets] = useState(true);
    const [warnOnPII, setWarnOnPII] = useState(true);
    const [strictHealthTerms, setStrictHealthTerms] = useState(false);
    const [customKeywords, setCustomKeywords] = useState("");

    useEffect(() => { loadPolicies(); }, []);

    const loadPolicies = async () => {
        setLoading(true);
        const data = await api.getPolicies();
        setPolicies(data);
        setLoading(false);
    };

    const openEdit = (p: PolicyDTO) => {
        setEditing(p);
        setCreating(false);
        setName(p.name);
        setBlockSecrets(p.blockSecrets);
        setWarnOnPII(p.warnOnPII);
        setStrictHealthTerms(p.strictHealthTerms);
        setCustomKeywords(p.customKeywords.join(", "));
    };

    const openCreate = () => {
        setEditing(null);
        setCreating(true);
        setName("");
        setBlockSecrets(true);
        setWarnOnPII(true);
        setStrictHealthTerms(false);
        setCustomKeywords("");
    };

    const closeModal = () => { setEditing(null); setCreating(false); };

    const handleSave = async () => {
        const keywords = customKeywords.split(",").map((k) => k.trim()).filter(Boolean);
        const input: CreatePolicyInput = { name, blockSecrets, warnOnPII, strictHealthTerms, customKeywords: keywords };

        if (editing) {
            await api.updatePolicy(editing.id, input);
        } else {
            await api.createPolicy(input);
        }

        closeModal();
        loadPolicies();
    };

    return (
        <div className="p-6 lg:p-8" style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Policies</h1>
                    <p className="page-subtitle">Manage security scanning policies</p>
                </div>
                <button className="btn-primary btn-sm" onClick={openCreate}>
                    <Plus size={14} /> New Policy
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16"><span className="spinner" /></div>
            ) : (
                <div className="glass-card" style={{ overflow: "hidden" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th style={{ textAlign: "center" }}>Block Secrets</th>
                                <th style={{ textAlign: "center" }}>Warn PII</th>
                                <th style={{ textAlign: "center" }}>Health Terms</th>
                                <th>Keywords</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {policies.map((p) => (
                                <tr key={p.id}>
                                    <td className="font-semibold">{p.name}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <StatusDot active={p.blockSecrets} />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <StatusDot active={p.warnOnPII} />
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <StatusDot active={p.strictHealthTerms} />
                                    </td>
                                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                                        {p.customKeywords.length > 0 ? p.customKeywords.join(", ") : "—"}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Modal ──────────────────────────────── */}
            {(editing || creating) && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <div
                        className="glass-card modal-card animate-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold">
                                {editing ? "Edit Policy" : "Create Policy"}
                            </h2>
                            <button className="sidebar-toggle" onClick={closeModal}>
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="form-label">Name</label>
                                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            <ToggleRow label="Block Secrets" active={blockSecrets} onChange={setBlockSecrets} />
                            <ToggleRow label="Warn on PII" active={warnOnPII} onChange={setWarnOnPII} />
                            <ToggleRow label="Strict Health Terms" active={strictHealthTerms} onChange={setStrictHealthTerms} />

                            <div>
                                <label className="form-label">Custom Keywords (comma-separated)</label>
                                <input
                                    className="input-field"
                                    value={customKeywords}
                                    onChange={(e) => setCustomKeywords(e.target.value)}
                                    placeholder="e.g. confidential, restricted"
                                />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button className="btn-primary btn-sm" onClick={handleSave}>Save</button>
                                <button className="btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Helpers ─────────────────────────────────────────── */

function StatusDot({ active }: { active: boolean }) {
    return (
        <span style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: active ? "var(--color-risk-low)" : "var(--color-text-muted)",
        }} />
    );
}

function ToggleRow({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm">{label}</span>
            <div className={`toggle-switch ${active ? "active" : ""}`} onClick={() => onChange(!active)}>
                <div className="toggle-dot" />
            </div>
        </div>
    );
}
