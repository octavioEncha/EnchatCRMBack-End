import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";

const router = Router();

router.get(
  "/message/:conversationId",
  messageController.specificMessaByConversationID
);

export default router;
