import { supabase } from "../config/supabaseClient.js";
import * as leadsService from "./leads.service.js";
import * as conversationService from "./conversation.service.js";
import { findProfileById } from "../services/profile.service.js";
import { sendingWebhookMessage } from "./webhook.service.js";

import * as messageModel from "../models/message.model.js";
import * as attachmentModel from "../models/attachments.model.js";

/**
 * Retorna todas as mensagens de uma conversa específica
 */
export const especificMessaByConversationID = async ({ conversationId }) => {
  const getMessagesByConversationId =
    await messageModel.especificMessaByConversationID({ conversationId });

  if (!getMessagesByConversationId) {
    throw new Error("Nenhuma mensagem encontrada para esta conversa.");
  }
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
export const createNewMessage = async ({ data, event, instance }) => {
  try {
    const messageContent =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.base64 ||
      "";
    let remoteJidRaw = "";
    let lid = "";

    if (data?.key?.remoteJid.endsWith("@s.whatsapp.net")) {
      remoteJidRaw = data?.key?.remoteJid;
      lid = data?.key?.remoteJidAlt.replace(/\D/g, "");
      console.log("veio normal");
    } else {
      remoteJidRaw = data?.key?.remoteJidAlt;
      lid = data?.key?.remoteJid.replace(/\D/g, "");
    }

    const phone = remoteJidRaw ? remoteJidRaw.replace(/\D/g, "") : null;
    const sourceType = data?.messageType;

    const fromMe = data?.key?.fromMe;

    if (!phone) {
      console.warn("⚠️ Dados insuficientes:", { phone, messageContent });
      return null;
    }

    // Busca ou cria o lead
    let lead = await leadsService.searchLead({ phone });

    if (!lead) {
      lead = await leadsService.createNewLead({
        data,
        phone,
        instance,
        lid,
      });
    }

    // Busca ou cria a conversa
    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: { user_id: lead.user_id, lead_id: lead.id },
      });
      if (!conversation) {
        console.warn("⚠️ Falha ao criar conversa.");
        return null;
      }
    }

    // Define tipo de remetentecd
    const senderType = fromMe ? "user" : "lead";

    let dataMessage = {};

    let createNewMessage = null;

    if (
      sourceType === "documentMessage" ||
      sourceType === "audioMessage" ||
      sourceType === "imageMessage"
    ) {
      const buffer = Buffer.from(messageContent, "base64");
      const mymeTypeMap = {
        documentMessage: "application/pdf",
        audioMessage: "audio/mpeg",
        imageMessage: "image/jpeg",
      };
      const contentType = mymeTypeMap[sourceType] || "application/octet-stream";
      const uploadResult = await attachmentModel.uploadAttachment({
        buffer,
        contentType,
      });
      dataMessage = {
        conversation_id: conversation.id,
        senderType,
        lead_id: lead.id,
        attachmentUrl: uploadResult,
        messageType: sourceType,
      };

      createNewMessage = await messageModel.createMessageWithAttachment({
        data: dataMessage,
      });
    } else {
      dataMessage = {
        conversation_id: conversation.id,
        senderType,
        lead_id: lead.id,
        messageContent,
      };
      createNewMessage = await messageModel.createMessage({
        data: dataMessage,
      });

      if (!createNewMessage) {
        throw new Error("Falha ao criar nova mensagem.");
      }
    }
    const updateLastMessageTimestamp =
      await messageModel.updateLastMessageTimestamp({
        conversationId: conversation.id,
      });
    if (conversation.ai_enabled) {
      const profile = await findProfileById({ id: instance });
      const sendingWebhook = await sendingWebhookMessage({
        webhookURL: profile.webhook_url,
        content: dataMessage,
      });
    }

    return {
      lead,
      conversation,
      message: createNewMessage,
    };
  } catch (err) {
    console.error("❌ Erro inesperado em createNewMessage:", err.message);
    return null;
  }
};

// Cria uma mensagem enviada pelo disparo no CRM
export const createMessageForShootingToLead = async ({ phone, content }) => {
  try {
    let lead = await leadsService.searchLead({ phone });

    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

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
      createMessageForShootingToLead.content
    );
    return { lead, conversation, message: createMessageForShootingToLead };
  } catch (err) {
    console.error("❌ Erro em createNewMessageSendCRM:", err.message);
    return null;
  }
};
/**
 * Cria nova mensagem enviada manualmente pelo CRM (via interface)
 */
export const createNewMessageSendCRM = async ({ data }) => {
  try {
    const phone = data?.key?.remoteJid?.replace(/\D/g, "");
    const content = data?.message?.conversation;

    if (!phone || !content) {
      console.warn("⚠️ Dados insuficientes:", { phone, content });
      return null;
    }

    // Busca ou cria o lead
    let lead = await leadsService.searchLead({ phone });
    if (!lead) {
      lead = await leadsService.createNewLead({ data, phone });
      if (!lead) {
        console.warn("⚠️ Falha ao criar lead.");
        return null;
      }
    }

    // Busca ou cria a conversa
    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: { user_id: lead.user_id, lead_id: lead.id },
      });
      if (!conversation) {
        console.warn("⚠️ Falha ao criar conversa.");
        return null;
      }
    }

    const createNewMessage = await messageModel.createNewMessageSendCRM({
      content,
      lead_id: lead.id,
      conversation_id: conversation.id,
    });
    if (!createNewMessage) {
      throw new Error("Falha ao criar nova mensagem via CRM.");
    }

    const updateLastMessageTimestamp =
      await messageModel.updateLastMessageTimestamp({
        conversationId: conversation.id,
      });

    console.log("✅ Mensagem criada via CRM:", createNewMessage.content);
    return { lead, conversation, message: createNewMessage };
  } catch (err) {
    console.error("❌ Erro em createNewMessageSendCRM:", err.message);
    return null;
  }
};
