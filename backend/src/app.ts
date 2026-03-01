import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import scanRoutes from "./routes/scan";
import policyRoutes from "./routes/policies";
import analyticsRoutes from "./routes/analytics";
import { errorHandler } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// ── Global middleware ───────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: CORS_ORIGIN,
        credentials: true,
    })
);
app.use(express.json({ limit: "1mb" }));

// ── Health check ────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── Error handler (must be last) ────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[SafePrompt] Server running on http://localhost:${PORT}`);
});

export default app;
