import * as insta_service from "../services/insta-oficial.service.js";

export const receiveMessageAndCommentsByWebhook = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    await insta_service.receiveMessageAndCommentsByWebhook({
      inbox_id: id,
      data: body,
    });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyTokenByMeta = async (req, res) => {
  try {
    const inboxId = req.params.id;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    await insta_service.setVerification({ inboxId });

    return res.status(200).send(challenge);
  } catch (error) {
    console.error("Erro na verificação Meta:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

export const getAllPostsByInboxId = async (req, res) => {
  try {
    const inbox_id = req.params.inboxId;
    const posts = await insta_service.getAllPostsByInboxId({ inbox_id });
    res.status(200).json(posts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const postWithComments = await insta_service.getPostWithCommentsById({
      post_id: postId,
    });
    res.status(200).json(postWithComments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const reloadAllPostByInboxId = async (req, res) => {
  try {
    const inbox_id = req.params.inboxId;

    await insta_service.reloadAllPostByInboxId({ inbox_id });

    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createReplyToPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const data = req.body;
    await insta_service.createReplyToPost({ postId, data });
    res.status(201).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getReplysToPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const replys = await insta_service.getReplysToPostById({ postId });
    res.status(200).json(replys);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateReplyById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const replyId = req.params.replyId;
    const data = req.body;

    await insta_service.updateReplyById({ postId, replyId, data });

    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteReplyById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const replyId = req.params.replyId;

    await insta_service.deleteReplyById({ postId, replyId });

    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllCommentsByPostId = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await insta_service.getAllCommentsByPostId({
      postId,
    });

    res.status(200).json({ comments });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const replyCommentById = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const data = req.body;

    await insta_service.replyCommentById({ commentId, data });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const deleteCommentById = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    await insta_service.deleteCommentById({ comment_id: commentId });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
