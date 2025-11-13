import { processedMessageIds } from "../models/message.model.js";
import {
  sessions,
  ensureContact,
  saveMessage,
} from "../services/session.service.js";
import * as messagesService from "../services/messages.service.js";

export const webhookController = async (req, res) => {
  try {
    const { data, event, instance } = req.body; // 👈 aqui está a diferença
    const lead = await messagesService.createNewMessage({ data: req.body });
    if (!data?.key) {
      console.log("❌ Dados inválidos recebidos:", req.body);
      return res.status(200).send("Dados inválidos");
    }

    const { id: messageId, remoteJid, fromMe } = data.key;

    // Evita processar mensagens repetidas
    if (processedMessageIds.has(messageId))
      return res.status(200).send("Duplicada");

    processedMessageIds.add(messageId);

    // Extrai o texto (formato Evolution API)
    const text =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      data.message?.imageMessage?.caption ||
      data.message?.videoMessage?.caption ||
      null;

    const pushName = data.pushName || "Desconhecido";
    if (!text || !remoteJid) return res.status(200).send("Sem texto");

    const direction = fromMe ? "outgoing" : "incoming";

    const msg = {
      id: messageId,
      lead_id: lead.lead?.id,
      direction,
      user: lead.lead?.name,
      text,
      avatar: lead.lead?.avatar,
      conversation_id: lead.conversation.id,
      timestamp: new Date(),
      contact: remoteJid,
    };

    console.log(`💬 Nova mensagem (${direction}):`, msg);

    // Salva e envia para todas as sessões
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      ensureContact(sessionId, remoteJid, pushName);
      saveMessage(sessionId, remoteJid, msg);

      const eventName =
        direction === "outgoing" ? "outgoing_message" : "incoming_message";

      global.io.to(session.socketId).emit(eventName, msg);
    }

    // 🔥 Cria registro no Supabase (ou outra persistência)

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return res.status(200).send("Erro");
  }
};
