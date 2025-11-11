import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller.js";

const router = Router();

router.get("/conversation/:id", conversationController.listAllConversation);

export default router;
