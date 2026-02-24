import {
  sessions,
  ensureContact,
  saveMessage,
} from "../services/session.service.js";

export const sendMessageToClientConnected = async ({
  instance,
  finalMessage,
}) => {
  const sessionId = instance;

  if (!sessionId || !sessions[sessionId]) {
    console.warn("⚠️ Sessão não encontrada:", sessionId);
    return;
  }

  const phone = finalMessage.contact;
  const name = finalMessage.user;

  // Garante que o contato existe na sessão
  ensureContact(sessionId, phone, name);

  // Salva a mensagem na sessão
  saveMessage(sessionId, phone, finalMessage);

  let eventName = "incoming_message";

  if (finalMessage.direction === "outgoing") {
    eventName = "outgoing_message";
  } else if (finalMessage.direction === "IA") {
    eventName = "IA";
  }

  global.io.to(sessions[sessionId].socketId).emit(eventName, finalMessage);
};
