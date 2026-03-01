import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen flex-col gap-4 p-6">
            <div className="text-6xl font-black" style={{ color: "var(--color-accent)", lineHeight: 1 }}>
                404
            </div>
            <p style={{ color: "var(--color-text-secondary)" }}>
                Page not found
            </p>
            <button className="btn-primary btn-sm" onClick={() => navigate("/ai-playground")}>
                <ArrowLeft size={14} /> Go to Playground
            </button>
        </div>
    );
}
