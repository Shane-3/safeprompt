import { Router } from "express";
import {
    listPolicies,
    getPolicy,
    createPolicy,
    updatePolicy,
} from "../controllers/policyController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { validate } from "../middleware/validation";
import { createPolicySchema, updatePolicySchema } from "../utils/validators";
import { Role } from "../models/types";

const router = Router();

// All policy routes require authentication
router.use(authenticate);

router.get("/", listPolicies);
router.get("/:id", getPolicy);

// Create / Update require ADMIN role
router.post(
    "/",
    requireRole(Role.ADMIN),
    validate(createPolicySchema),
    createPolicy
);
router.put(
    "/:id",
    requireRole(Role.ADMIN),
    validate(updatePolicySchema),
    updatePolicy
);

export default router;
