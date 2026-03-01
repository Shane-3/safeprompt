import type { Request, Response, NextFunction } from "express";
import type { ErrorResponse } from "../models/types";

/**
 * Custom application error that carries an HTTP status code.
 */
export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

/**
 * Centralised error-handling middleware.
 * Converts thrown errors into a uniform JSON response.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err instanceof AppError ? err.statusCode : 500;

    const body: ErrorResponse = {
        error: statusCode >= 500 ? "Internal Server Error" : err.name,
        message:
            statusCode >= 500
                ? "An unexpected error occurred"
                : err.message,
        statusCode,
        timestamp: new Date().toISOString(),
    };

    // Log server errors for debugging
    if (statusCode >= 500) {
        console.error("[ERROR]", err);
    }

    res.status(statusCode).json(body);
}
