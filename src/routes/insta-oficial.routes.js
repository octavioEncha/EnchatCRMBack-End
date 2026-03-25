import { Router } from "express";
import * as insta_controller from "../controllers/insta-oficial.controller.js";

const router = Router();

router.post(
  "/webhook/:id",
  insta_controller.receiveMessageAndCommentsByWebhook,
);

router.get("/webhook/:id", insta_controller.verifyTokenByMeta);

router.get(
  "/inboxes/:inboxId/comments",
  insta_controller.getAllCommentsByInboxId,
);

router.post("/comments/:commentId/reply", insta_controller.replyCommentById);

router.delete("/comments/:commentId", insta_controller.deleteCommentById);

export default router;
