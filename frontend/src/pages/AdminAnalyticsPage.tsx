import { useAnalytics } from "../hooks/useAnalytics";
import { RefreshCw } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Legend,
} from "recharts";

const RISK_COLORS = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
};

const CHART_TOOLTIP_STYLE = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    color: "var(--color-text-primary)",
    fontSize: "0.8125rem",
};

const AXIS_TICK = { fill: "#6e8a9a", fontSize: 11 };

const BAR_COLORS = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#047857"];

export function AdminAnalyticsPage() {
    const { summary, timeline, loading, error, refresh } = useAnalytics();

    const pieData = summary
        ? [
            { name: "Low", value: summary.riskDistribution.LOW },
            { name: "Medium", value: summary.riskDistribution.MEDIUM },
            { name: "High", value: summary.riskDistribution.HIGH },
        ]
        : [];

    return (
        <div className="p-6 lg:p-8" style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Scan metrics and risk distribution</p>
                </div>
                <button className="btn-secondary btn-sm" onClick={refresh}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {loading && (
                <div className="text-center py-16"><span className="spinner" /></div>
            )}

            {error && <div className="error-box mb-5">{error}</div>}

            {summary && !loading && (
                <div className="animate-in flex flex-col gap-5">
                    {/* Metric cards */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                        {([
                            { label: "Total Scans", value: summary.totalScans, color: "var(--color-accent)" },
                            { label: "Low Risk", value: summary.riskDistribution.LOW, color: RISK_COLORS.LOW },
                            { label: "Medium Risk", value: summary.riskDistribution.MEDIUM, color: RISK_COLORS.MEDIUM },
                            { label: "High Risk", value: summary.riskDistribution.HIGH, color: RISK_COLORS.HIGH },
                        ]).map((m) => (
                            <div key={m.label} className="glass-card metric-card">
                                <div className="metric-label">{m.label}</div>
                                <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Charts grid */}
                    <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        {/* Pie */}
                        <div className="glass-card p-5">
                            <h3 className="section-title mb-4">Risk Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((entry, i) => (
                                            <Cell key={entry.name} fill={Object.values(RISK_COLORS)[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#7e7e9a" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar */}
                        <div className="glass-card p-5">
                            <h3 className="section-title mb-4">Top Risk Categories</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={summary.topCategories}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="category" tick={AXIS_TICK} />
                                    <YAxis tick={AXIS_TICK} allowDecimals={false} />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {summary.topCategories.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="glass-card p-5">
                        <h3 className="section-title mb-4">Risk Levels Over Time</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={timeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="timestamp" tick={AXIS_TICK} />
                                <YAxis tick={AXIS_TICK} allowDecimals={false} />
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                                <Line type="monotone" dataKey="LOW" stroke={RISK_COLORS.LOW} strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="MEDIUM" stroke={RISK_COLORS.MEDIUM} strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="HIGH" stroke={RISK_COLORS.HIGH} strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
