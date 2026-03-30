import * as messageService from "./messages.service.js";
import {
  searchLeadByInstagramId,
  createLeadByReceiveInstagramContent,
  searchLeadId,
} from "./leads.service.js";
import {
  searchConversation,
  createNewConversation,
} from "./conversation.service.js";

import {
  createMessage,
  updateLastMessageTimestamp,
  updateLastMessageInboundTimestamp,
  createMessageWithAttachment,
} from "../models/message.model.js";

import { sendMessageToClientConnected } from "./websocket.service.js";

import {
  findInboxByIdOrThrow,
  setVerificationInInboxByMeta,
  setInstagramIdByWebhookReceive,
} from "../services/inbox.service.js";
import { uploadAttachment } from "../models/attachments.model.js";
import * as instaOficialModel from "../models/insta-oficial.model.js";

export const receiveMessageAndCommentsByWebhook = async ({
  inbox_id,
  data,
}) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  const entry = data?.entry?.[0];

  const isComment =
    Array.isArray(entry?.changes) && entry.changes[0]?.field === "comments";

  const isDM = Array.isArray(entry?.messaging) && entry.messaging.length > 0;

  if (isComment) {
    await commentsInPost({ inbox, data });
    return null;
  }

  if (isDM) {
    await messageInDmInstagram({ inbox, data });
    return null;
  }

  console.warn(
    "Webhook Instagram: tipo de evento não reconhecido",
    JSON.stringify(entry),
  );
  return null;
};

const commentsInPost = async ({ inbox, data }) => {
  const entry = data?.entry[0];

  const commentId = entry.changes[0].value.id;

  if (
    (await instaOficialModel.searchCommentById({ id: commentId })) ||
    (await instaOficialModel.searchReplyById({ id: commentId }))
  )
    return true;

  const pageId = entry.id;

  const changeValue = entry.changes[0].value;
  const mediaId = changeValue.media?.id;
  const senderId = changeValue.from.id;
  const senderUsername = changeValue.from.username;
  const commentText = changeValue.text;

  await setInstagramIdByWebhookReceive({ inboxId: inbox.id, id: pageId });

  let lead = await searchLeadByInstagramId({
    instagram_id: senderId,
    user_id: inbox.user_id,
  });

  if (!lead) {
    const profile = await getInformationsByInstagramId({
      instagram_token: inbox.instagram_token,
      id: senderId,
    });

    lead = await createLeadByReceiveInstagramContent({
      data: {
        inbox,
        user_id: inbox?.user_id,
        name: senderUsername,
        avatar: profile?.profile_pic
          ? profile?.profile_pic
          : "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
        email: "",
        phone: "",
        lid: "",
        pipeline_id: null,
        company: "",
        value: "",
        notes: "",
        tags: "",
        lead_type: "lead",
        instagram_id: senderId,
        is_follower: profile.is_user_follow_business
          ? profile.is_user_follow_business
          : false,
      },
    });
  }

  const commentSaved = await instaOficialModel.saveComments({
    data: {
      inbox_id: inbox.id,
      lead_id: lead.id,
      media_id: mediaId,
      media_type: entry.changes[0].value.media.media_product_type,
      comment_id: commentId,
      comment_content: commentText,
    },
  });

  const repliesToPost = await getReplysToPostById({ postId: mediaId });

  if (repliesToPost || repliesToPost.length > 0) {
    const replyToSend = repliesToPost.filter(
      (item) => item.comment_target === commentText,
    );

    if (replyToSend.length > 0) {
      await replyCommentById({
        commentId,
        data: {
          reply_content: replyToSend[0].comment_reply,
          send_to_dm: replyToSend[0].dm_reply ? true : false,
          message_to_dm: replyToSend[0].dm_reply,
          automation_message: true,
        },
      });
    }
  }
};

const messageInDmInstagram = async ({ inbox, data }) => {
  const value = data?.entry[0];

  const messageId = value.messaging[0].message.mid;

  if (await messageService.verifyMessageById({ messageId })) return null;

  const pageId = value.id;

  await setInstagramIdByWebhookReceive({ inboxId: inbox.id, id: pageId });

  const senderId = value.messaging[0].sender.id;

  const recipientId = value.messaging[0].recipient.id;

  const fromMe = recipientId === pageId ? "lead" : "user";

  const attachments = value.messaging[0].message.attachments;
  const messageType =
    attachments && attachments.length > 0 && attachments[0].type
      ? attachments[0].type
      : "text";

  const messageContent = value.messaging[0].message.text ?? "";

  let lead = await searchLeadByInstagramId({
    instagram_id: recipientId === pageId ? senderId : recipientId,
    user_id: inbox.user_id,
  });

  if (!lead) {
    const profile = await getInformationsByInstagramId({
      instagram_token: inbox.instagram_token,
      id: recipientId === pageId ? senderId : recipientId,
    });

    console.log("Profile do Instagram", profile);

    lead = await createLeadByReceiveInstagramContent({
      data: {
        inbox,
        user_id: inbox?.user_id,
        name: profile.username,
        avatar: profile?.profile_pic
          ? profile?.profile_pic
          : "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
        email: "",
        phone: "",
        lid: "",
        pipeline_id: null,
        company: "",
        value: "",
        notes: "",
        tags: "",
        lead_type: "lead",
        instagram_id: senderId,
        is_follower: profile.is_user_follow_business,
      },
    });
  }

  let conversation = await searchConversation({ lead_id: lead.id });
  if (!conversation) {
    conversation = await createNewConversation({
      data: {
        inbox_id: inbox.id,
        lead_id: lead.id,
      },
    });
  }

  const MEDIA_TYPES = new Set([
    "sticker",
    "image",
    "audio",
    "video",
    "document",
  ]);

  if (MEDIA_TYPES.has(messageType)) {
    const mimeTypeMap = {
      document: "application/pdf",
      audio: "audio/mpeg",
      image: "image/jpeg",
      video: "video/mp4",
      sticker: "image/jpeg",
    };
    const messageTypeMap = {
      document: "documentMessage",
      audio: "audioMessage",
      image: "imageMessage",
      video: "videoMessage",
      sticker: "imageMessage",
    };

    const base64 = await getBase64ForMediaReceivesInInstagramWebhook({
      link: attachments[0].payload.url,
    });

    const uploadUrl = await uploadAttachment({
      buffer: Buffer.from(base64, "base64"),
      contentType: mimeTypeMap[messageType],
    });

    const createdNewMessage = await createMessageWithAttachment({
      data: {
        conversation_id: conversation.id,
        messageId,
        senderType: "lead",
        lead_id: lead.id,
        attachmentUrl: uploadUrl,
        messageType: messageTypeMap[messageType],
      },
    });

    await Promise.all([
      updateLastMessageTimestamp({ conversationId: conversation.id }),
      updateLastMessageInboundTimestamp({ conversationId: conversation.id }),
    ]);

    const now = new Date().toISOString();

    await sendMessageToClientConnected({
      instance: inbox.id,
      finalMessage: {
        id: createdNewMessage.id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox_provider: "instagram",
        direction: "incoming",
        text: uploadUrl,
        mediaUrl: uploadUrl,
        mediaType: mimeTypeMap[messageType],
        timestamp: now,
        contact: lead.instagram_id,
        last_inbound_message_at: now,
        user: lead.name,
        avatar: lead.avatar,
        ai_enabled: conversation.ai_enabled,
      },
    });

    return;
  }

  // TEXT message path
  const createdNewMessage = await createMessage({
    data: {
      conversation_id: conversation.id,
      lead_id: lead.id,
      inbox: inbox.id,
      senderType: fromMe,
      mediaType: "text",
      messageContent,
      messageId,
    },
  });

  if (!createdNewMessage) throw new Error("Erro ao salvar mensagem");

  await Promise.all([
    updateLastMessageTimestamp({ conversationId: conversation.id }),
    updateLastMessageInboundTimestamp({ conversationId: conversation.id }),
  ]);

  const now = new Date().toISOString();

  await sendMessageToClientConnected({
    instance: inbox.id,
    finalMessage: {
      id: createdNewMessage.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      inbox_provider: "instagram",
      direction: fromMe === "lead" ? "incoming" : "outgoing",
      text: messageContent,
      timestamp: now,
      contact: lead.instagram_id,
      last_inbound_message_at: now,
      user: lead.name,
      avatar: lead.avatar,
      ai_enabled: conversation.ai_enabled,
    },
  });

  return;
};

export const sendMessage = async ({ inbox, userId, lead, text }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${inbox?.instagram_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inbox.instagram_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          id: lead?.instagram_id,
        },
        message: {
          text: text,
        },
      }),
    },
  );

  const data = await response.json();

  return data.message_id;
};

export const sendMessageAfterCommentInPost = async ({
  inbox,
  comment_id,
  text,
}) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${inbox?.instagram_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inbox.instagram_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          comment_id: comment_id,
        },
        message: {
          text: text,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.json());
  }
  const data = await response.json();

  console.log(data);

  return data.message_id;
};

export const setVerification = async ({ inboxId }) => {
  await setVerificationInInboxByMeta({ inboxId });
};

const getInformationsByInstagramId = async ({ instagram_token, id }) => {
  const response = await fetch(`https://graph.instagram.com/v25.0/${id}`, {
    headers: {
      Authorization: `Bearer ${instagram_token}`,
    },
  });

  const data = await response.json();

  return data;
};

export const getBase64ForMediaReceivesInInstagramWebhook = async ({ link }) => {
  const response = await fetch(link);

  const buffer = await response.arrayBuffer();

  const base64 = Buffer.from(buffer).toString("base64");

  return base64;
};

export const getAllPostsByInboxId = async ({ inbox_id }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  const response = await fetch(
    `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url&limit=10&access_token=${inbox.instagram_token}`,
  );

  const data = await response.json();

  const posts = data.data;

  await Promise.all(
    posts.map(async (post) => {
      const exists = await instaOficialModel.findPostById({ id: post.id });

      if (!exists) {
        await instaOficialModel.setPost({
          data: {
            inbox_id: inbox.id,
            post_id: post.id,
            caption: post.caption,
            media_type: post.media_type,
            media_url: post.media_url,
            permalink: post.permalink,
            timestamp: post.timestamp,
          },
        });
      }
    }),
  );

  return await instaOficialModel.findPostsByInboxId({ id: inbox.id });
};

export const getPostWithCommentsById = async ({ post_id }) => {
  const post = await instaOficialModel.findPostById({ id: post_id });
  if (!post) {
    throw new Error("Post not found by id");
  }
  const comments = await getAllCommentsByPostId({ postId: post_id });

  return { post, comments };
};

export const reloadAllPostByInboxId = async ({ inbox_id }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  await instaOficialModel.deleteAllPostByInboxId({ id: inbox.id });

  await getAllPostsByInboxId({ inbox_id: inbox.id });

  return true;
};

export const createReplyToPost = async ({ postId, data }) => {
  const post = await instaOficialModel.findPostById({ id: postId });

  if (!post) throw new Error("Post not found by id");

  data.post_id = post.id;

  await instaOficialModel.createReplyToPost({
    data,
  });
};

export const getReplysToPostById = async ({ postId }) => {
  const post = await instaOficialModel.findPostById({ id: postId });

  if (!post) throw new Error("Post not found by id");

  return await instaOficialModel.getReplysToPostById({ id: post.id });
};

export const updateReplyById = async ({ postId, replyId, data }) => {
  if (!(await instaOficialModel.findPostById({ id: postId })))
    throw new Error("Post not found by id");

  const reply = await instaOficialModel.findReplyToPostByReplyId({
    id: replyId,
  });

  if (!reply) throw new Error("Reply not found by id");

  await instaOficialModel.updateReplyById({ id: reply.id, data });
};

export const deleteReplyById = async ({ postId, replyId }) => {
  if (!(await instaOficialModel.findPostById({ id: postId })))
    throw new Error("Post not found by id");

  const reply = await instaOficialModel.findReplyToPostByReplyId({
    id: replyId,
  });

  if (!reply) throw new Error("Reply not found by id");

  return await instaOficialModel.deleteReplyById({ id: reply.id });
};

export const getAllCommentsByPostId = async ({ postId }) => {
  if (!(await instaOficialModel.findPostById({ id: postId })))
    throw new Error("Post not found by id");

  const allComments = await instaOficialModel.findCommentsByPostsId({
    id: postId,
  });

  return allComments;
};

export const getMediaPostById = async ({ instagram_token, media_id }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${media_id}?fields=id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url&access_token=${instagram_token}`,
  );

  const data = await response.json();

  return data;
};

export const replyCommentById = async ({ commentId, data }) => {
  const comment = await instaOficialModel.findCommentById({ id: commentId });

  if (!comment) throw new Error("Comment not found by id");
  if (comment.comment_response) throw new Error("Comment already replied ");

  const lead = await searchLeadId({ id: comment.lead_id });

  const inbox = await findInboxByIdOrThrow({ id: comment.inbox_id });

  const response = await fetch(
    `https://graph.instagram.com/v25.0/${comment.comment_id}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `@${lead.name} ${data.reply_content}`,
        access_token: inbox.instagram_token,
      }),
    },
  );

  const dataResponse = await response.json();

  if (!response.ok) {
    throw new Error("Ocorreu um erro ao enviar comentário.");
  }

  await instaOficialModel.saveReplyToCommentById({
    data: {
      id: comment.id,
      reply: data.automation_message
        ? `AUTOMATION @${lead.name} ${data.reply_content}`
        : data.reply_content,
      comment_response_id: dataResponse.id,
    },
  });

  if (data.send_to_dm) {
    let conversation = await searchConversation({ lead_id: lead.id });
    if (!conversation) {
      conversation = await createNewConversation({
        data: {
          inbox_id: inbox.id,
          lead_id: lead.id,
        },
      });
    }
    const messageId = await sendMessageAfterCommentInPost({
      inbox,
      comment_id: commentId,
      text: data.message_to_dm,
    });

    const createdNewMessage = await createMessage({
      data: {
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox: inbox.id,
        senderType: data.automation_message ? "ai" : "user",
        mediaType: "text",
        messageContent: data.automation_message
          ? data.message_to_dm
          : data.message_to_dm,
        messageId,
      },
    });

    if (!createdNewMessage) throw new Error("Erro ao salvar mensagem");

    await Promise.all([
      updateLastMessageTimestamp({ conversationId: conversation.id }),
      //updateLastMessageInboundTimestamp({ conversationId: conversation.id }),
    ]);

    const now = new Date().toISOString();

    await sendMessageToClientConnected({
      instance: inbox.id,
      finalMessage: {
        id: createdNewMessage.id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox_provider: "instagram",
        direction: "outgoing",
        text: data.message_to_dm,
        timestamp: now,
        contact: lead.instagram_id,
        last_inbound_message_at: now,
        user: lead.name,
        avatar: lead.avatar,
        ai_enabled: conversation.ai_enabled,
      },
    });
  }
};

export const deleteCommentById = async ({ comment_id }) => {
  const comment = await instaOficialModel.findCommentById({ id: comment_id });

  if (!comment) throw new Error("Comment not found by id");

  const inbox = await findInboxByIdOrThrow({ id: comment.inbox_id });

  const response = await fetch(
    `https://graph.instagram.com/v25.0/${comment.comment_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${inbox.instagram_token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("The comment could not be deleted. ");
  }

  await instaOficialModel.deleteCommentById({ comment_id });
};
