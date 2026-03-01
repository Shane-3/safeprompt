import type { Request, Response, NextFunction } from "express";
import * as analyticsService from "../services/analyticsService";

export async function summaryHandler(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const summary = await analyticsService.getSummary();
        res.status(200).json(summary);
    } catch (err) {
        next(err);
    }
}

export async function timelineHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { startDate, endDate } = req.query as {
            startDate?: string;
            endDate?: string;
        };
        const data = await analyticsService.getTimeline(startDate, endDate);
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}
