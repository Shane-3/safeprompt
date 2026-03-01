import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { AIPlaygroundPage } from "./pages/AIPlaygroundPage";
import { AdminPoliciesPage } from "./pages/AdminPoliciesPage";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/ai-playground" replace /> : <LoginPage />
                }
            />
            <Route
                path="/ai-playground"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <AIPlaygroundPage />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/policies"
                element={
                    <ProtectedRoute requireAdmin>
                        <AppLayout>
                            <AdminPoliciesPage />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/analytics"
                element={
                    <ProtectedRoute requireAdmin>
                        <AppLayout>
                            <AdminAnalyticsPage />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/ai-playground" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
