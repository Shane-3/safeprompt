import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Middleware factory: validate `req.body` against a Zod schema.
 * Returns 400 with field-level errors if validation fails.
 */
export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const fieldErrors = result.error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            }));

            res.status(400).json({
                error: "Validation Error",
                message: "Invalid request body",
                statusCode: 400,
                timestamp: new Date().toISOString(),
                details: fieldErrors,
            });
            return;
        }

        // Replace body with the parsed (coerced) result
        req.body = result.data;
        next();
    };
}

/**
 * Middleware factory: validate `req.query` against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const fieldErrors = result.error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            }));

            res.status(400).json({
                error: "Validation Error",
                message: "Invalid query parameters",
                statusCode: 400,
                timestamp: new Date().toISOString(),
                details: fieldErrors,
            });
            return;
        }

        req.query = result.data;
        next();
    };
}
