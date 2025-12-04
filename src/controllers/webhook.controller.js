import { processedMessageIds } from "../models/message.model.js";
import {
  sessions,
  ensureContact,
  saveMessage,
} from "../services/session.service.js";
import * as messagesService from "../services/messages.service.js";

export const webhookController = async (req, res) => {
  try {
    const { data, event, instance } = req.body;

    const result = await messagesService.createNewMessage({
      data,
      event,
      instance,
    });
    console.log(result);

    if (!result) {
      console.log("❌ Falha ao processar mensagem");
      return res.status(400).send("Falha ao processar");
    }

    if (!data?.key) {
      console.log("❌ Dados inválidos recebidos:", req.body);
      return res.status(400).send("Dados inválidos");
    }

    const { id: messageId, remoteJid, fromMe } = data.key;
    console.log(remoteJid);
    const text =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      data.message?.imageMessage?.caption ||
      data.message?.videoMessage?.caption ||
      null;

    const direction = fromMe ? "outgoing" : "incoming";

    // ------------------------------------------------------------
    // 🔥 Monta a mensagem completa para enviar ao FRONT-END
    // ------------------------------------------------------------

    const finalMessage = {
      id: result.message?.id || messageId,
      conversation_id: result.conversation?.id,
      lead_id: result.lead?.id,
      direction,
      text: result.message?.content || text,
      hasAttachment: result.message?.has_attachment || false,
      attachmentUrl: result.message?.content?.startsWith("http")
        ? result.message?.content
        : null,
      attachmentType: result.message?.attachment_type || null,
      user: result.lead?.name,
      avatar: result.lead?.avatar,
      timestamp: new Date(),
      contact: result.lead.phone,
      ai_enabled: result.conversation.ai_enabled,
    };

    console.log("📨 Enviando ao front:", finalMessage);

    // ------------------------------------------------------------
    // 🔥 Envia ao WebSocket correto
    // ------------------------------------------------------------
    const sessionId = instance;

    if (!sessionId || !sessions[sessionId]) {
      console.warn("⚠️ Sessão não encontrada:", sessionId);
    } else {
      ensureContact(sessionId, remoteJid, result.lead?.name);
      saveMessage(sessionId, remoteJid, finalMessage);

      const eventName =
        direction === "outgoing" ? "outgoing_message" : "incoming_message";

      global.io.to(sessions[sessionId].socketId).emit(eventName, finalMessage);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return res.status(200).send("Erro");
  }
};
