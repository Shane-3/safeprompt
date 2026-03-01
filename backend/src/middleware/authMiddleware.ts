import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import type { Role } from "../models/types";

/**
 * Middleware: verify JWT from the Authorization header and attach
 * the decoded payload to `req.user`.
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Unauthorized",
            message: "Missing or invalid Authorization header",
            statusCode: 401,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    const token = header.slice(7);
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({
            error: "Unauthorized",
            message: "Invalid or expired token",
            statusCode: 401,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Middleware factory: restrict access to users with a specific role.
 * Must be used AFTER `authenticate`.
 */
export function requireRole(role: Role) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || req.user.role !== role) {
            res.status(403).json({
                error: "Forbidden",
                message: `This endpoint requires the ${role} role`,
                statusCode: 403,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
}
