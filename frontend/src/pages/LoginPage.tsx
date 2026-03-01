import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Fingerprint } from "lucide-react";

export function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
        } catch {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-6"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 50%), var(--color-background)" }}>
            <div className="glass-card animate-in w-full" style={{ maxWidth: 400, padding: 36 }}>
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="logo-icon mx-auto mb-4" style={{ width: 48, height: 48, borderRadius: 12 }}>
                        <Fingerprint size={22} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-xl font-bold mb-1">SafePrompt</h1>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Sign in to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} id="login-form">
                    <div style={{ marginBottom: 24 }}>
                        <label htmlFor="email-input" className="form-label">Email</label>
                        <input
                            id="email-input"
                            className="input-field"
                            type="email"
                            placeholder="admin@demo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <label htmlFor="password-input" className="form-label">Password</label>
                        <input
                            id="password-input"
                            className="input-field"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

                    <button
                        id="login-button"
                        className="btn-primary w-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : null}
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>

                {/* Demo hint */}
                <div
                    style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "var(--color-accent-subtle)",
                        border: "1px solid rgba(16,185,129,0.12)",
                        color: "var(--color-text-secondary)",
                        marginTop: 24,
                        fontSize: 12,
                    }}>
                    <strong style={{ color: "var(--color-accent)" }}>Demo accounts:</strong><br />
                    Admin: admin@demo.com / admin123<br />
                    User: user@demo.com / demo123
                </div>
            </div>
        </div>
    );
}
