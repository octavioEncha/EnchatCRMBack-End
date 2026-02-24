import { supabase } from "../config/supabaseClient.js";
import * as leadsService from "./leads.service.js";
import * as conversationService from "./conversation.service.js";
import { findProfileById } from "../services/profile.service.js";
import { sendingWebhookMessage } from "./webhook.service.js";

import * as messageModel from "../models/message.model.js";
import * as attachmentModel from "../models/attachments.model.js";
import { sendMessageToClientConnected } from "./websocket.service.js";

import {
  sessions,
  ensureContact,
  saveMessage,
} from "../services/session.service.js";
import { text } from "express";

/**
 * Retorna todas as mensagens de uma conversa específica
 */
export const especificMessaByConversationID = async ({ conversationId }) => {
  const getMessagesByConversationId =
    await messageModel.especificMessaByConversationID({ conversationId });

  if (!getMessagesByConversationId) {
    throw new Error("Nenhuma mensagem encontrada para esta conversa.");
  }

  console.log(getMessagesByConversationId);
  return getMessagesByConversationId;
};

export const specificMessaByLeadId = async ({ lead_id }) => {
  const searchConversation = await conversationService.searchConversation({
    lead_id,
  });

  const getMessagesByConversationId =
    await messageModel.especificMessaByConversationID({
      conversationId: searchConversation.id,
    });

  if (!getMessagesByConversationId) {
    throw new Error("Nenhuma mensagem encontrada para este lead.");
  }

  return getMessagesByConversationId;
};

/**
 * Cria nova mensagem a partir do recebimento via WhatsApp
 * Pode ser enviada pelo usuário (fromMe = true) ou pelo lead (fromMe = false)
 */
export const createNewMessage = async ({ data, instance }) => {
  try {
    const messageId = data?.key?.id;
    if (!messageId) return null;

    const verifyMessageById = await messageModel.getMessageById({ messageId });

    if (verifyMessageById) {
      return null;
    }

    const messageContent =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.base64 ||
      "";

    const remoteJid = data?.key?.remoteJid;
    const remoteJidAlt = data?.key?.remoteJidAlt;

    if (!remoteJid && !remoteJidAlt) return null;

    const isWhatsAppJid = remoteJid?.endsWith("@s.whatsapp.net");
    const remoteJidRaw = isWhatsAppJid ? remoteJid : remoteJidAlt;

    const phone = remoteJidRaw?.replace(/\D/g, "");
    const fromMe = data?.key?.fromMe;

    if (!phone) return null;

    // ==============================
    // 🔎 BUSCA OU CRIA LEAD
    // ==============================

    let lead = await leadsService.searchLead({ phone, instance });

    if (!lead) {
      lead = await leadsService.createNewLead({
        data,
        phone,
        instance,
      });
      if (!lead) throw new Error("Erro ao criar lead");
    }

    // ==============================
    // 🔎 BUSCA OU CRIA CONVERSA
    // ==============================

    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: {
          user_id: lead.user_id,
          lead_id: lead.id,
          inbox_id: instance,
        },
      });

      if (!conversation) throw new Error("Erro ao criar conversa");
    }

    // ==============================
    // 💾 SALVA MENSAGEM DO LEAD
    // ==============================

    const createdMessage = await messageModel.createMessage({
      data: {
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox: instance,
        senderType: fromMe ? "user" : "lead",
        mediaType: "text",
        messageContent,
        messageId,
      },
    });

    if (!createdMessage) throw new Error("Erro ao salvar mensagem");

    await messageModel.updateLastMessageTimestamp({
      conversationId: conversation.id,
    });

    // ==============================
    // 📡 ENVIA PARA O FRONT
    // ==============================

    const finalMessage = {
      id: createdMessage.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      direction: fromMe ? "outgoing" : "incoming",
      text: messageContent,
      timestamp: new Date(),
      contact: lead.phone,
      user: lead.name,
      avatar: lead.avatar,
      ai_enabled: conversation.ai_enabled,
    };

    //await sendMessageToClientConnected({ instance, finalMessage });

    // ==============================
    // 🤖 FLUXO IA
    // ==============================

    if (conversation.ai_enabled && !fromMe) {
      // IA digitando...
      await sendMessageToClientConnected({
        // instance,
        finalMessage: {
          id: "typing-" + Date.now(),
          conversation_id: conversation.id,
          lead_id: lead.id,
          direction: "IA",
          text: "IA digitando...",
          timestamp: new Date(),
          contact: lead.phone,
          user: "IA",
        },
      });

      // Chama webhook IA
      const aiResponse = await sendingWebhookMessage({
        webhookURL:
          "https://serverpoint.enchat.in/webhook/9a7018a4-b6ee-4c16-8b40-0d73098e4a54",
        content: {
          conversation_id: conversation.id,
          message: messageContent,
          lead_id: lead.id,
          inbox: conversation.inbox_id,
        },
      });

      if (!aiResponse?.output) return;

      // ==============================
      // 📤 ENVIA RESPOSTA PARA LEAD (EVOLUTION)
      // ==============================

      await fetch(
        `https://edvedder.encha.com.br/message/sendText/${instance}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
          },
          body: JSON.stringify({
            number: lead.phone,
            text: aiResponse.output,
          }),
        },
      );

      // ==============================
      // 💾 SALVA RESPOSTA IA
      // ==============================

      const aiSaved = await messageModel.createNewMessageSendCRM({
        content: aiResponse.output,
        lead_id: lead.id,
        conversation_id: conversation.id,
        senderType: "IA",
      });

      await messageModel.updateLastMessageTimestamp({
        conversationId: conversation.id,
      });

      // ==============================
      // 📡 ENVIA RESPOSTA IA PRO FRONT
      // ==============================

      await sendMessageToClientConnected({
        instance,
        finalMessage: {
          id: aiSaved.id,
          conversation_id: conversation.id,
          lead_id: lead.id,
          direction: "IA",
          text: aiResponse.output,
          timestamp: new Date(),
          contact: lead.phone,
          user: "IA",
        },
      });
    }

    return { lead, conversation };
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    return null;
  }
};

// Cria uma mensagem enviada pelo disparo no CRM
export const createMessageForShootingToLead = async ({
  phone,
  content,
  instance,
}) => {
  try {
    let lead = await leadsService.searchLead({ phone, instance });

    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: {
          user_id: lead.user_id,
          lead_id: lead.id,
          instance,
        },
      });
    }

    const createMessageForShootingToLead =
      await messageModel.createMessageForShootingToLead({
        content,
        lead_id: lead.id,
        conversation_id: conversation.id,
      });
    if (!createMessageForShootingToLead) {
      throw new Error("Falha ao criar nova mensagem via Disparo do CRM.");
    }

    const updateLastMessageTimestamp =
      await messageModel.updateLastMessageTimestamp({
        conversationId: conversation.id,
      });

    console.log(
      "✅ Mensagem criada via Disparo do CRM:",
      createMessageForShootingToLead.content,
    );
    return { lead, conversation, message: createMessageForShootingToLead };
  } catch (err) {
    console.error("❌ Erro em createNewMessageSendCRM:", err.message);
    return null;
  }
};

export const createNewMessageSendCRM = async ({
  sessionId,
  leadId,
  content,
}) => {
  try {
    if (!sessionId || !leadId || !content) {
      throw new Error("Dados insuficientes");
    }

    // 🔎 Busca lead
    const lead = await leadsService.searchLeadId({ id: leadId });
    if (!lead) throw new Error("Lead não encontrado");

    // 🔎 Busca ou cria conversa
    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: {
          user_id: lead.user_id,
          lead_id: lead.id,
          inbox_id: sessionId,
        },
      });

      if (!conversation) throw new Error("Erro ao criar conversa");
    }

    // 💾 Salva no banco
    const createdMessage = await messageModel.createNewMessageSendCRM({
      content,
      lead_id: lead.id,
      conversation_id: conversation.id,
      senderType: user,
    });

    if (!createdMessage) {
      throw new Error("Erro ao salvar mensagem");
    }

    await messageModel.updateLastMessageTimestamp({
      conversationId: conversation.id,
    });

    // 📤 Envia para Evolution
    const response = await fetch(
      `https://edvedder.encha.com.br/message/sendText/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
        },
        body: JSON.stringify({
          number: lead.phone,
          text: content,
        }),
      },
    );

    if (!response.ok) {
      console.error(`⚠️ Falha ao enviar (${response.status})`);
    }

    // 📡 Emite no socket
    const finalMessage = {
      id: createdMessage.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      direction: "outgoing",
      text: content,
      timestamp: new Date(),
      contact: lead.phone,
      user: lead.name,
    };

    await sendMessageToClientConnected({
      instance: sessionId,
      finalMessage,
    });

    return { lead, conversation, message: createdMessage };
  } catch (err) {
    console.error("❌ Erro em createNewMessageSendCRM:", err.message);
    throw err;
  }
};

export const sendMessage = async ({ data }) => {
  const searchLead = await leadsService.searchLeadId({ id: data.lead_id });

  let searchConvers = await conversationService.searchConversation({
    lead_id: data.lead_id,
  });
  if (!searchConvers) {
    const leadData = {
      inbox_id: data.user_id,
      lead_id: data.lead_id,
    };
    searchConvers = await conversationService.createNewConversation({
      data: leadData,
    });
  }

  data.user_id;

  const response = await fetch(
    `https://edvedder.encha.com.br/message/sendText/${data.user_id}`,
    //`http://localhost:8081/message/sendText/${data.user}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
        //apikey: "meu_token_secreto",
      },
      body: JSON.stringify({
        number: searchLead.phone,
        text: data.content,
      }),
    },
  );

  const dataResponse = await response.json();
  if (dataResponse?.response?.message[0]?.exists === false) {
    throw new Error("Number not found or not exist");
  }

  const createNewMessage = await messageModel.createNewMessageSendCRM({
    content: data.content,
    lead_id: searchLead.id,
    conversation_id: searchConvers.id,
    senderType: "user",
  });
  if (!createNewMessage) {
    throw new Error("Falha ao criar nova mensagem via CRM.");
  }

  const updateLastMessageTimestamp =
    await messageModel.updateLastMessageTimestamp({
      conversationId: searchConvers.id,
    });

  const finalMessage = {
    id: createNewMessage.id,
    conversation_id: searchConvers.id,
    lead_id: searchLead.id,
    direction: "outgoing",
    text: data.content,
    user: searchLead.name,
    avatar: searchLead.avatar,
    timestamp: new Date(),
    contact: searchLead.phone,
    ai_enabled: searchConvers.ai_enabled,
  };

  if (!data.user_id || !sessions[data.user_id]) {
    console.warn("⚠️ Sessão não encontrada:", data.user_id);
  } else {
    ensureContact(data.user_id, searchLead.phone, searchLead.name);
    saveMessage(data.user_id, searchLead.phone, data.content);

    const eventName = "outgoing_message";

    global.io.to(sessions[data.user_id].socketId).emit(eventName, finalMessage);
  }
  return true;
};
