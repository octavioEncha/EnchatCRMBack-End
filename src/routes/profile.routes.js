import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";

const router = Router();

router.post("/token", profileController.generateTokenToUser);

router.post("/sign-up", profileController.signUpProfile);

router.get("/enabled-profile/:id", profileController.enabledProfile);

export default router;
