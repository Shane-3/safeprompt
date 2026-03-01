import { Router } from "express";
import {
    summaryHandler,
    timelineHandler,
} from "../controllers/analyticsController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { Role } from "../models/types";

const router = Router();

// All analytics routes require ADMIN role
router.use(authenticate);
router.use(requireRole(Role.ADMIN));

router.get("/summary", summaryHandler);
router.get("/timeline", timelineHandler);

export default router;
