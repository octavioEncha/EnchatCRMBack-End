import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";

const router = Router();

router.get(
  "/message/:conversationId",
  messageController.specificMessaByConversationID
);

router.get("/message/lead/:lead_id", messageController.specificMessaByLeadId);
export default router;
