import { Router } from "express";
import * as insta_controller from "../controllers/insta-oficial.controller.js";

const router = Router();

router.post("/webhook/:id", insta_controller.receiveMessageByWebhook);

export default router;
