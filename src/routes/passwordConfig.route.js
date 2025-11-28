import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import * as passwordConfigController from "../controllers/passwordConfig.controller.js";

const router = Router();

router.post("/forgot-password", passwordConfigController.forgot_password);

router.get("/verify-token/:token", passwordConfigController.verifyToken);

router.put("/update/:token", passwordConfigController.updatePassword);

export default router;
