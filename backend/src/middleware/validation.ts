import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

// Validate body against Zod schema
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

// Validate query against Zod schema
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
