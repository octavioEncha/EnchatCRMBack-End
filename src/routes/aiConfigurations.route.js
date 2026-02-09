import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import * as aiConfigurationsController from "../controllers/aiConfigurations.controller.js";

const router = Router();

router.get("/:id", aiConfigurationsController.getAIConfiguration);

router.put("/update/:id", aiConfigurationsController.updateConfigIA);

export default router;
