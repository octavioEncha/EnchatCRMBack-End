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

  let lead = await searchLeadByInstagramId({ id: senderId });

  if (!lead) {
    lead = await createLeadByReceiveInstagramContent({
      data: {
        user_id: inbox?.user_id,
        name: senderUsername,
        avatar:
          "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
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

  // TODO: salvar o comentário como mensagem se necessário
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
    id: recipientId === pageId ? senderId : recipientId,
  });

  if (!lead) {
    const profile = await getInformationsByInstagramId({
      instagram_token: inbox.instagram_token,
      id: recipientId === pageId ? senderId : recipientId,
    });

    lead = await createLeadByReceiveInstagramContent({
      data: {
        user_id: inbox?.user_id,
        name: profile.username,
        avatar:
          "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
        email: "",
        phone: "",
        lid: "",
        pipeline_id: null,
        company: "",
        value: "",
        notes: "",
        tags: "",
        lead_type: "lead",
        instagram_id: profile.id,
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

export const setVerification = async ({ inboxId }) => {
  await setVerificationInInboxByMeta({ inboxId });
};

const getInformationsByInstagramId = async ({ instagram_token, id }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${id}?fields=id,username&access_token=${instagram_token}`,
  );

  const data = await response.json();

  return data;
};

export const getBase64ForMediaReceivesInInstagramWebhook = async ({ link }) => {
  const response = await fetch(link);

  const buffer = await response.arrayBuffer();

  const base64 = Buffer.from(buffer).toString("base64");

  return base64;
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

  const inbox = await findInboxByIdOrThrow({ id: comment.inbox_id });

  const response = await fetch(
    `https://graph.instagram.com/v25.0/${comment.comment_id}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: data.reply_content,
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
      reply: data.reply_content,
      comment_response_id: dataResponse.id,
    },
  });

  if (data.send_to_dm) {
    const lead = await searchLeadId({ id: comment.lead_id });
    const conversation = await searchConversation({ lead_id: lead.id });

    const messageId = await sendMessage({
      inbox,
      userId: null,
      lead,
      text: data.message_to_dm,
    });

    const createdNewMessage = await createMessage({
      data: {
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox: inbox.id,
        senderType: "user",
        mediaType: "text",
        messageContent: data.message_to_dm,
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

export const getAllCommentsByInboxId = async ({ inbox_id }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  const comments = await instaOficialModel.getAllCommentsByInboxId({
    inbox_id: inbox.id,
  });

  const commentsWithMedia = await Promise.all(
    comments.map(async (comment) => {
      const mediaInstagram = await getMediaPostById({
        instagram_token: inbox.instagram_token,
        media_id: comment.media_id,
      });
      return {
        ...comment,
        mediaInstagram,
      };
    }),
  );

  return commentsWithMedia;
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
