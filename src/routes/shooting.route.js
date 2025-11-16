import { Router } from "express";

import * as shootingController from "../controllers/shooting.controller.js";

const router = Router();

router.post("/shooting", shootingController.shootingToLead);

export default router;
