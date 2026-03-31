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
    // Tentar obter informações do perfil. Lidar com perfis privados/não seguidores.
    let profile = {};
    try {
      profile = await getInformationsByInstagramId({
        instagram_token: inbox.instagram_token,
        id: senderId,
      });
    } catch (error) {
      console.warn(
        `Não foi possível obter informações detalhadas para o usuário ${senderId}: ${error.message}`,
      );
      // Definir valores padrão ou lidar com o erro de forma apropriada
      profile.username = senderUsername; // Usar o username do comentário como fallback
      profile.profile_pic =
        "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png";
      profile.is_user_follow_business = false;
    }

    lead = await createLeadByReceiveInstagramContent({
      data: {
        inbox,
        user_id: inbox?.user_id,
        name: profile.username || senderUsername || "Instagram User",
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

  // Corrigido: Verificar se repliesToPost é um array e tem elementos
  if (repliesToPost && repliesToPost.length > 0) {
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
    let profile = {};
    try {
      profile = await getInformationsByInstagramId({
        instagram_token: inbox.instagram_token,
        id: recipientId === pageId ? senderId : recipientId,
      });
    } catch (error) {
      console.warn(
        `Não foi possível obter informações detalhadas para o usuário ${senderId}: ${error.message}`,
      );
      profile.username = "Instagram User";
      profile.profile_pic =
        "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png";
      profile.is_user_follow_business = false;
    }

    console.log("Profile do Instagram", profile);

    lead = await createLeadByReceiveInstagramContent({
      data: {
        inbox,
        user_id: inbox?.user_id,
        name: profile.username || "Instagram User",
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
        instagram_id: recipientId === pageId ? senderId : recipientId,
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

export const sendMessage = async ({ inbox, leadId, text }) => {
  const lead = await searchLeadId({ id: leadId });
  if (!lead || !lead.instagram_id) {
    throw new Error("Lead ou Instagram ID não encontrado.");
  }

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
          id: lead.instagram_id,
        },
        message: {
          text: text,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro ao enviar DM:", data);
    throw new Error(data.error?.message || "Erro desconhecido ao enviar DM.");
  }

  return data.message_id;
};

export const sendMessageAfterCommentInPost = async ({
  inbox,
  leadId,
  text,
}) => {
  const lead = await searchLeadId({ id: leadId });
  if (!lead || !lead.instagram_id) {
    throw new Error("Lead ou Instagram ID não encontrado.");
  }

  // Corrigido: O endpoint para enviar DM é o mesmo, o que muda é o recipient.
  // Não se usa comment_id para enviar DM, mas sim o ID do usuário (lead.instagram_id).
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
          id: lead.instagram_id, // Usar o ID do lead para enviar a DM
        },
        message: {
          text: text,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Erro ao enviar DM após comentário:", errorData);
    throw new Error(
      errorData.error?.message ||
        "Ocorreu um erro ao enviar DM após comentário.",
    );
  }
  const data = await response.json();

  console.log(data);

  return data.message_id;
};

export const setVerification = async ({ inboxId }) => {
  await setVerificationInInboxByMeta({ inboxId });
};

const getInformationsByInstagramId = async ({ instagram_token, id }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${id}?fields=username,profile_picture_url,follows_count,followed_by_count,is_private,is_verified,biography,website,media_count&access_token=${instagram_token}`,
    {
      headers: {
        Authorization: `Bearer ${instagram_token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    // Lidar com erros da API, como permissões insuficientes para perfis privados
    console.error("Erro ao obter informações do Instagram:", data);
    throw new Error(
      data.error?.message ||
        "Não foi possível obter informações do perfil do Instagram.",
    );
  }

  // Adicionar um campo para indicar se o usuário segue a empresa, se possível
  // Esta informação geralmente não está disponível diretamente na API de perfil de usuário genérica
  // Seria necessário usar o endpoint de "followers" da conta comercial, se disponível e com permissão.
  data.is_user_follow_business = false; // Valor padrão

  return data;
};

export const getBase64ForMediaReceivesInInstagramWebhook = async ({ link }) => {
  const response = await fetch(link);

  if (!response.ok) {
    throw new Error(`Falha ao buscar mídia: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const base64 = Buffer.from(buffer).toString("base64");

  return base64;
};

export const getAllPostsByInboxId = async ({ inbox_id }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  const response = await fetch(
    `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url&limit=100&access_token=${inbox.instagram_token}`,
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Erro ao obter posts do Instagram:", errorData);
    throw new Error(
      errorData.error?.message || "Não foi possível obter posts do Instagram.",
    );
  }

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

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Erro ao obter mídia do post:", errorData);
    throw new Error(
      errorData.error?.message || "Não foi possível obter mídia do post.",
    );
  }

  const data = await response.json();

  return data;
};

export const replyCommentById = async ({ commentId, data }) => {
  const comment = await instaOficialModel.findCommentById({ id: commentId });

  if (!comment) throw new Error("Comment not found by id");
  if (comment.comment_response) throw new Error("Comment already replied ");

  const lead = await searchLeadId({ id: comment.lead_id });

  const inbox = await findInboxByIdOrThrow({ id: comment.inbox_id });

  // Corrigido: O username deve ser obtido do lead para garantir que é o correto para a menção.
  const usernameToMention = lead.name; // Assumindo que lead.name é o username do Instagram

  const response = await fetch(
    `https://graph.instagram.com/v25.0/${comment.comment_id}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `@${usernameToMention} ${data.reply_content}`,
        access_token: inbox.instagram_token,
      }),
    },
  );

  const dataResponse = await response.json();

  if (!response.ok) {
    console.error("Erro ao enviar comentário:", dataResponse);
    throw new Error(
      dataResponse.error?.message || "Ocorreu um erro ao enviar comentário.",
    );
  }

  await instaOficialModel.saveReplyToCommentById({
    data: {
      id: comment.id,
      reply: data.automation_message
        ? `AUTOMATION @${usernameToMention} ${data.reply_content}`
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
    // Corrigido: Chamar sendMessageAfterCommentInPost com leadId em vez de comment_id
    const messageId = await sendMessageAfterCommentInPost({
      inbox,
      leadId: lead.id, // Passar o ID do lead
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
      //updateLastMessageInboundTimestamp({ conversationId: conversation.id }), // Esta linha estava comentada, mantida assim.
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
    const errorData = await response.json();
    console.error("Erro ao deletar comentário:", errorData);
    throw new Error(
      errorData.error?.message || "The comment could not be deleted.",
    );
  }

  await instaOficialModel.deleteCommentById({ comment_id });
};
