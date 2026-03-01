import type { Request, Response, NextFunction } from "express";
import * as policyService from "../services/policyService";

export async function listPolicies(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const policies = await policyService.getAllPolicies();
        res.status(200).json(policies);
    } catch (err) {
        next(err);
    }
}

export async function getPolicy(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const policy = await policyService.getPolicyById(req.params.id as string);
        res.status(200).json(policy);
    } catch (err) {
        next(err);
    }
}

export async function createPolicy(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const policy = await policyService.createPolicy(req.body);
        res.status(201).json(policy);
    } catch (err) {
        next(err);
    }
}

export async function updatePolicy(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const policy = await policyService.updatePolicy(req.params.id as string, req.body);
        res.status(200).json(policy);
    } catch (err) {
        next(err);
    }
}
