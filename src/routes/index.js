import { Router } from "express";
import webhookRoutes from "./webhook.routes.js";
import sessionRoutes from "./session.routes.js";

const router = Router();

router.use("/", webhookRoutes);
router.use("/", sessionRoutes);

export default router; // 👈 ESSA LINHA É FUNDAMENTAL
