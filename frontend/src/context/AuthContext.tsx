import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import type { AuthUser } from "../types";
import { Role } from "../types";
import * as api from "../services/api";

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.login(email, password);
        setUser(res.user);
        setToken(res.token);
        api.setToken(res.token);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        api.setToken(null);
    }, []);

    const value: AuthContextValue = {
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === Role.ADMIN,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
