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

const DEFAULT_AVATAR =
  "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildLeadPayload = ({
  inbox,
  name,
  avatar,
  instagram_id,
  is_follower,
}) => ({
  inbox,
  user_id: inbox.user_id,
  name,
  avatar: avatar || DEFAULT_AVATAR,
  email: "",
  phone: "",
  lid: "",
  pipeline_id: null,
  company: "",
  value: "",
  notes: "",
  tags: "",
  lead_type: "lead",
  instagram_id,
  is_follower: is_follower ?? false,
});

const buildWebsocketPayload = ({
  message,
  conversation,
  lead,
  direction,
  text,
  mediaUrl,
  mediaType,
}) => {
  const now = new Date().toISOString();
  return {
    id: message.id,
    conversation_id: conversation.id,
    lead_id: lead.id,
    inbox_provider: "instagram",
    direction,
    text,
    ...(mediaUrl && { mediaUrl, mediaType }),
    timestamp: now,
    contact: lead.instagram_id,
    last_inbound_message_at: now,
    user: lead.name,
    avatar: lead.avatar,
    ai_enabled: conversation.ai_enabled,
  };
};

/**
 * Busca o perfil do Instagram de forma segura.
 * Retorna {} se o perfil for privado, sem consentimento (code 230),
 * ou qualquer outro erro da API / rede.
 */
const getInstagramProfile = async ({ instagram_token, id }) => {
  try {
    const response = await fetch(`https://graph.instagram.com/v25.0/${id}`, {
      headers: { Authorization: `Bearer ${instagram_token}` },
    });

    const json = await response.json();

    if (json?.error) {
      console.warn(
        `Perfil Instagram indisponível para ${id} (code ${json.error.code}): ${json.error.message}`,
      );
      return {};
    }

    return json;
  } catch (err) {
    console.warn(`Erro de rede ao buscar perfil Instagram ${id}:`, err.message);
    return {};
  }
};

/**
 * Busca ou cria um lead pelo instagram_id.
 * Usa os dados do webhook como fallback quando o perfil não está acessível.
 */
const getOrCreateLead = async ({
  instagram_id,
  inbox,
  fallbackName,
  fallbackAvatar,
}) => {
  const existing = await searchLeadByInstagramId({
    instagram_id,
    user_id: inbox.user_id,
  });

  if (existing) return existing;

  const profile = await getInstagramProfile({
    instagram_token: inbox.instagram_token,
    id: instagram_id,
  });

  return createLeadByReceiveInstagramContent({
    data: buildLeadPayload({
      inbox,
      name: profile?.username || fallbackName || `instagram_${instagram_id}`,
      avatar: profile?.profile_pic || fallbackAvatar || DEFAULT_AVATAR,
      instagram_id,
      is_follower: profile?.is_user_follow_business ?? false,
    }),
  });
};

const getOrCreateConversation = async ({ inbox, lead }) => {
  const existing = await searchConversation({ lead_id: lead.id });
  if (existing) return existing;

  return createNewConversation({
    data: { inbox_id: inbox.id, lead_id: lead.id },
  });
};

// ─── Webhook entry point ──────────────────────────────────────────────────────

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

// ─── Comments ─────────────────────────────────────────────────────────────────

const commentsInPost = async ({ inbox, data }) => {
  const entry = data?.entry[0];
  const changeValue = entry.changes[0].value;
  const commentId = changeValue.id; // ID externo do Instagram

  // Deduplicação — evita processar o mesmo evento duas vezes
  const [alreadyComment, alreadyReply] = await Promise.all([
    instaOficialModel.searchCommentById({ id: commentId }),
    instaOficialModel.searchReplyById({ id: commentId }),
  ]);
  if (alreadyComment || alreadyReply) return;

  const pageId = entry.id;
  const mediaId = changeValue.media?.id;
  const senderId = changeValue.from.id;
  const senderUsername = changeValue.from.username;
  const commentText = changeValue.text;

  await setInstagramIdByWebhookReceive({ inboxId: inbox.id, id: pageId });

  const lead = await getOrCreateLead({
    instagram_id: senderId,
    inbox,
    fallbackName: senderUsername, // username sempre vem no webhook de comentário
  });

  // Salva o comentário e usa o registro retornado (ID interno do banco)
  const commentSaved = await instaOficialModel.saveComments({
    data: {
      inbox_id: inbox.id,
      lead_id: lead.id,
      media_id: mediaId,
      media_type: changeValue.media?.media_product_type,
      comment_id: commentId,
      comment_content: commentText,
    },
  });

  // Busca automações configuradas para este post
  let repliesToPost = [];
  try {
    repliesToPost = await getReplysToPostById({ postId: mediaId });
  } catch {
    // Post ainda não cadastrado no banco — sem automação, segue em frente
  }

  if (Array.isArray(repliesToPost) && repliesToPost.length > 0) {
    const replyToSend = repliesToPost.find(
      (item) => item.comment_target === commentText,
    );

    if (replyToSend) {
      // Usa o ID interno do comentário salvo, não o ID externo do Instagram
      await replyCommentById({
        commentId: commentSaved.id,
        data: {
          reply_content: replyToSend.comment_reply,
          send_to_dm: Boolean(replyToSend.dm_reply),
          message_to_dm: replyToSend.dm_reply,
          automation_message: true,
        },
      });
    }
  }
};

// ─── DM ───────────────────────────────────────────────────────────────────────

const messageInDmInstagram = async ({ inbox, data }) => {
  const entry = data?.entry[0];
  const messaging = entry.messaging[0];
  const messageId = messaging.message.mid;

  if (await messageService.verifyMessageById({ messageId })) return null;

  const pageId = entry.id;
  await setInstagramIdByWebhookReceive({ inboxId: inbox.id, id: pageId });

  const senderId = messaging.sender.id;
  const recipientId = messaging.recipient.id;
  const fromMe = recipientId === pageId ? "lead" : "user";
  const leadInstagramId = recipientId === pageId ? senderId : recipientId;

  const attachments = messaging.message.attachments;
  const messageType =
    attachments?.length > 0 && attachments[0].type
      ? attachments[0].type
      : "text";
  const messageContent = messaging.message.text ?? "";

  // DMs não trazem username no webhook — usa o ID como fallback
  const lead = await getOrCreateLead({
    instagram_id: leadInstagramId,
    inbox,
    fallbackName: `instagram_${leadInstagramId}`,
  });

  const conversation = await getOrCreateConversation({ inbox, lead });

  // ── Mensagem com mídia ───────────────────────────────────────────────────

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

    await sendMessageToClientConnected({
      instance: inbox.id,
      finalMessage: buildWebsocketPayload({
        message: createdNewMessage,
        conversation,
        lead,
        direction: "incoming",
        text: uploadUrl,
        mediaUrl: uploadUrl,
        mediaType: mimeTypeMap[messageType],
      }),
    });

    return;
  }

  // ── Mensagem de texto ────────────────────────────────────────────────────

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

  await sendMessageToClientConnected({
    instance: inbox.id,
    finalMessage: buildWebsocketPayload({
      message: createdNewMessage,
      conversation,
      lead,
      direction: fromMe === "lead" ? "incoming" : "outgoing",
      text: messageContent,
    }),
  });
};

// ─── Send messages ────────────────────────────────────────────────────────────

export const sendMessage = async ({ inbox, lead, text }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${inbox.instagram_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inbox.instagram_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: lead.instagram_id },
        message: { text },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Erro ao enviar mensagem: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return data.message_id;
};

export const sendMessageAfterCommentInPost = async ({ inbox, lead, text }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${inbox.instagram_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inbox.instagram_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: lead.instagram_id },
        message: { text },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Erro ao enviar DM após comentário: ${JSON.stringify(err)}`,
    );
  }

  const data = await response.json();
  return data.message_id;
};

export const setVerification = async ({ inboxId }) => {
  await setVerificationInInboxByMeta({ inboxId });
};

// ─── Instagram Graph API helpers ──────────────────────────────────────────────

export const getBase64ForMediaReceivesInInstagramWebhook = async ({ link }) => {
  const response = await fetch(link);
  if (!response.ok) throw new Error(`Falha ao baixar mídia: ${link}`);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
};

// ─── Posts ────────────────────────────────────────────────────────────────────

export const getAllPostsByInboxId = async ({ inbox_id }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  const response = await fetch(
    `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url&limit=100&access_token=${inbox.instagram_token}`,
  );

  if (!response.ok) throw new Error("Erro ao buscar posts do Instagram");

  const { data } = await response.json();

  await Promise.all(
    data.map(async (post) => {
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

  return instaOficialModel.findPostsByInboxId({ id: inbox.id });
};

export const getPostWithCommentsById = async ({ post_id }) => {
  const post = await instaOficialModel.findPostById({ id: post_id });
  if (!post) throw new Error("Post not found by id");
  const comments = await getAllCommentsByPostId({ postId: post_id });
  return { post, comments };
};

export const reloadAllPostByInboxId = async ({ inbox_id }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });
  await instaOficialModel.deleteAllPostByInboxId({ id: inbox.id });
  await getAllPostsByInboxId({ inbox_id: inbox.id });
  return true;
};

// ─── Replies to posts ─────────────────────────────────────────────────────────

export const createReplyToPost = async ({ postId, data }) => {
  const post = await instaOficialModel.findPostById({ id: postId });
  if (!post) throw new Error("Post not found by id");
  await instaOficialModel.createReplyToPost({
    data: { ...data, post_id: post.id },
  });
};

export const getReplysToPostById = async ({ postId }) => {
  const post = await instaOficialModel.findPostById({ id: postId });
  if (!post) throw new Error("Post not found by id");
  return instaOficialModel.getReplysToPostById({ id: post.id });
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

  return instaOficialModel.deleteReplyById({ id: reply.id });
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const getAllCommentsByPostId = async ({ postId }) => {
  if (!(await instaOficialModel.findPostById({ id: postId })))
    throw new Error("Post not found by id");

  return instaOficialModel.findCommentsByPostsId({ id: postId });
};

export const getMediaPostById = async ({ instagram_token, media_id }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${media_id}?fields=id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url&access_token=${instagram_token}`,
  );
  if (!response.ok) throw new Error("Erro ao buscar mídia do Instagram");
  return response.json();
};

export const replyCommentById = async ({ commentId, data }) => {
  // commentId = ID interno do banco (não o ID externo do Instagram)
  const comment = await instaOficialModel.findCommentById({ id: commentId });
  if (!comment) throw new Error("Comment not found by id");
  if (comment.comment_response) throw new Error("Comment already replied");

  const [lead, inbox] = await Promise.all([
    searchLeadId({ id: comment.lead_id }),
    findInboxByIdOrThrow({ id: comment.inbox_id }),
  ]);

  // Responde publicamente no comentário
  const replyResponse = await fetch(
    `https://graph.instagram.com/v25.0/${comment.comment_id}/replies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `@${lead.name} ${data.reply_content}`,
        access_token: inbox.instagram_token,
      }),
    },
  );

  if (!replyResponse.ok) {
    const err = await replyResponse.json();
    throw new Error(`Erro ao enviar comentário: ${JSON.stringify(err)}`);
  }

  const replyData = await replyResponse.json();

  await instaOficialModel.saveReplyToCommentById({
    data: {
      id: comment.id,
      reply: data.automation_message
        ? `AUTOMATION @${lead.name} ${data.reply_content}`
        : data.reply_content,
      comment_response_id: replyData.id,
    },
  });

  // Envia DM se configurado
  if (data.send_to_dm && data.message_to_dm) {
    const conversation = await getOrCreateConversation({ inbox, lead });

    const messageId = await sendMessageAfterCommentInPost({
      inbox,
      lead,
      text: data.message_to_dm,
    });

    const createdNewMessage = await createMessage({
      data: {
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox: inbox.id,
        senderType: data.automation_message ? "ai" : "user",
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

    await sendMessageToClientConnected({
      instance: inbox.id,
      finalMessage: buildWebsocketPayload({
        message: createdNewMessage,
        conversation,
        lead,
        direction: "outgoing",
        text: data.message_to_dm,
      }),
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
      headers: { Authorization: `Bearer ${inbox.instagram_token}` },
    },
  );

  if (!response.ok) throw new Error("The comment could not be deleted.");

  await instaOficialModel.deleteCommentById({ comment_id });
};
