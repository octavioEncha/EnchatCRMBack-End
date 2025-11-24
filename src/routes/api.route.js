import { Router } from "express";
import * as apiController from "../controllers/api.controller.js";
import { authMiddleware } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/sendMessage", authMiddleware, apiController.sendMessage);

export default router;
