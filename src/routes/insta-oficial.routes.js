import { Router } from "express";
import * as insta_controller from "../controllers/insta-oficial.controller.js";

const router = Router();

//WEBHOOK
router.post(
  "/webhook/:id",
  insta_controller.receiveMessageAndCommentsByWebhook,
);

router.get("/webhook/:id", insta_controller.verifyTokenByMeta);

//POSTS
router.get("/inboxes/:inboxId/posts", insta_controller.getAllPostsByInboxId);

router.get("/posts/:postId/comments", insta_controller.getPostById);

router.put("/inboxes/:inboxId/posts", insta_controller.reloadAllPostByInboxId);

//REPLIES TO POSTS WITH COMMENTS TARGETS
router.post("/posts/:postId/replies", insta_controller.createReplyToPost);

router.get("/posts/:postId/replies", insta_controller.getReplysToPostById);

router.put("/posts/:postId/replies/:replyId", insta_controller.updateReplyById);

router.delete(
  "/posts/:postId/replies/:replyId",
  insta_controller.deleteReplyById,
);

//COMMENTS
router.get("/posts/:postId/comments", insta_controller.getAllCommentsByPostId);

router.post("/comments/:commentId/reply", insta_controller.replyCommentById);

router.delete("/comments/:commentId", insta_controller.deleteCommentById);

export default router;
