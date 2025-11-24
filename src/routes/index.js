import { Router } from "express";
import webhookRoutes from "./webhook.routes.js";
import sessionRoutes from "./session.routes.js";
import conversatioRoutes from "./conversation.route.js";
import messageRoutes from "./message.route.js";
import leadRoutes from "./lead.route.js";
import shootingRoutes from "./shooting.route.js";
import apiRoutes from "./api.route.js";
import profileRoutes from "./profile.routes.js";

const router = Router();

router.use("/", webhookRoutes);
router.use("/", sessionRoutes);
router.use("/", conversatioRoutes);
router.use("/", messageRoutes);
router.use("/", leadRoutes);
router.use("/", shootingRoutes);
router.use("/api", apiRoutes);
router.use("/", profileRoutes);

export default router; // 👈 ESSA LINHA É FUNDAMENTAL
