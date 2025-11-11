import { Router } from "express";
import webhookRoutes from "./webhook.routes.js";
import sessionRoutes from "./session.routes.js";
import userRoutes from "./user.routes.js";
import conversatioRoutes from "./conversation.route.js";
import messageRoutes from "./message.route.js";
import leadRoutes from "./lead.route.js";

const router = Router();

router.use("/", webhookRoutes);
router.use("/", sessionRoutes);
router.use("/", userRoutes);
router.use("/", conversatioRoutes);
router.use("/", messageRoutes);
router.use("/", leadRoutes);

export default router; // 👈 ESSA LINHA É FUNDAMENTAL
