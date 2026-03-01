import { Router } from "express";
import { loginHandler, logoutHandler } from "../controllers/authController";
import { validate } from "../middleware/validation";
import { loginSchema } from "../utils/validators";

const router = Router();

router.post("/login", validate(loginSchema), loginHandler);
router.post("/logout", logoutHandler);

export default router;
