import { processedMessageIds } from "../models/message.model.js";
import {
  sessions,
  ensureContact,
  saveMessage,
} from "../services/session.service.js";

export const webhookController = (req, res) => {
  try {
    const { data } = req.body;

    if (!data?.key) return res.status(200).send("Dados inválidos");

    const { id: messageId, remoteJid, fromMe } = data.key;

    // Evita processar mensagens repetidas
    if (processedMessageIds.has(messageId))
      return res.status(200).send("Duplicada");

    processedMessageIds.add(messageId);

    // Extrai o texto (padrão Evolution API)
    const text =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      data.message?.imageMessage?.caption ||
      data.message?.videoMessage?.caption ||
      null;

    const pushName = data.pushName || "Desconhecido";
    if (!text || !remoteJid) return res.status(200).send("Sem texto");

    // Define se é mensagem enviada ou recebida
    const direction = fromMe ? "outgoing" : "incoming";

    const msg = {
      id: messageId,
      direction,
      user: pushName,
      text,
      timestamp: new Date(),
      contact: remoteJid,
    };

    console.log(data);
    // Salva e envia para todas as sessões
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      ensureContact(sessionId, remoteJid, pushName);
      saveMessage(sessionId, remoteJid, msg);

      // 🔥 Agora diferenciamos o evento dependendo da direção
      const eventName =
        direction === "outgoing" ? "outgoing_message" : "incoming_message";

      global.io.to(session.socketId).emit(eventName, msg);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Erro no webhook:", error.message);
    return res.status(200).send("Erro");
  }
};
