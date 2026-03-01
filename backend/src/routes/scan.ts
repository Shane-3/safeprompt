import { Router } from "express";
import { scanHandler } from "../controllers/scanController";
import { authenticate } from "../middleware/authMiddleware";
import { validate } from "../middleware/validation";
import { scanSchema } from "../utils/validators";

const router = Router();

router.post("/", authenticate, validate(scanSchema), scanHandler);

export default router;
