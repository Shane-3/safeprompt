import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Fingerprint,
    Scan,
    BookOpen,
    BarChart3,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
    children: ReactNode;
}

interface NavItem {
    label: string;
    path: string;
    icon: ReactNode;
    adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Playground", path: "/ai-playground", icon: <Scan size={18} /> },
    { label: "Policies", path: "/admin/policies", icon: <BookOpen size={18} />, adminOnly: true },
    { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={18} />, adminOnly: true },
];

export function AppLayout({ children }: AppLayoutProps) {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

    return (
        <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
            {/* ── Sidebar ──────────────────────────── */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo" onClick={() => navigate("/ai-playground")}>
                        <div className="logo-icon">
                            <Fingerprint size={18} strokeWidth={2.5} />
                        </div>
                        {!collapsed && <span className="logo-text">SafePrompt</span>}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {visibleNav.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                className={`nav-link ${active ? "nav-link-active" : ""}`}
                                onClick={() => navigate(item.path)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!collapsed && <span className="nav-label">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {!collapsed && (
                        <div className="user-info">
                            <div className="user-avatar">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-details">
                                <span className="user-email">{user?.email}</span>
                                <span className="user-role">{isAdmin ? "Admin" : "User"}</span>
                            </div>
                        </div>
                    )}
                    <button className="nav-link logout-btn" onClick={logout}>
                        <span className="nav-icon"><LogOut size={18} /></span>
                        {!collapsed && <span className="nav-label">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────── */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
