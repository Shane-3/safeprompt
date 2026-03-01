import type { Request, Response, NextFunction } from "express";
import * as scanService from "../services/scanService";

export async function scanHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { prompt, policyId } = req.body;
        const userId = req.user!.userId;
        const result = await scanService.scanPrompt(prompt, policyId, userId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}
