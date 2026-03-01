import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";

export async function loginHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export function logoutHandler(
    _req: Request,
    res: Response
): void {
    // JWT is stateless — client discards the token.
    // A real-world impl would add the token to a blacklist.
    res.status(200).json({ message: "Logged out successfully" });
}
