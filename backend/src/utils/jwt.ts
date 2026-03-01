import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "../models/types";

const SECRET: jwt.Secret = process.env.JWT_SECRET ?? "fallback-dev-secret";

// 24 hours in seconds
const EXPIRATION_SECONDS = 60 * 60 * 24;

/**
 * Sign a JWT containing the user's id, email, and role.
 */
export function signToken(payload: JwtPayload): string {
    const data: Record<string, unknown> = { ...payload };
    const opts: SignOptions = { expiresIn: EXPIRATION_SECONDS };
    return jwt.sign(data, SECRET, opts);
}

/**
 * Verify and decode a JWT. Throws if invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, SECRET) as JwtPayload;
}
