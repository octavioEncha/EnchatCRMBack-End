import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import * as aiConfigurationsController from "../controllers/aiConfigurations.controller.js";

const router = Router();

router.get("/:id_profile", aiConfigurationsController.getAIConfiguration);

router.put("/update/:id_profile", aiConfigurationsController.updateConfigIA);

export default router;
