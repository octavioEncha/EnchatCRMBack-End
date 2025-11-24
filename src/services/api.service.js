import { searchLeadId } from "../services/leads.service.js";
import { searchConversationId } from "../services/conversation.service.js";
import { createMessage } from "../models/message.model.js";
import {
  sessions,
  ensureContact,
  saveMessage,
} from "../services/session.service.js";

export const sendMessage = async ({ data }) => {
  const searchLead = await searchLeadId({ id: data.lead_id });

  if (!searchLead) {
    throw new Error("Lead not found");
  }
  const searchConversation = await searchConversationId({
    id: data.conversation_id,
  });
  if (!searchConversation) {
    throw new Error("Conversation not found");
  }

  const response = await fetch(
    `https://edvedder.encha.com.br/message/sendText/${searchLead.user_id}`,
    //`http://localhost:8081/message/sendText/${searchLead.user_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
        //apikey: "meu_token_secreto",
      },
      body: JSON.stringify({
        number: searchLead.phone,
        text: data.message,
      }),
    }
  );
  const dataResponse = await response.json();
  if (!response.ok) {
    throw new Error(dataResponse.error);
  }
  const MessageData = {
    conversation_id: searchConversation.id,
    senderType: "user",
    lead_id: searchLead.id,
    messageContent: data.message,
  };
  const saveMessage = await createMessage({ data: MessageData });

  const finalMessage = {
    id: saveMessage.id,
    conversation_id: searchConversation.id,
    lead_id: searchLead.id,
    direction: "outgoing",
    text: data.message,
    hasAttachment: false,
    attachmentUrl: null,
    attachmentType: null,
    user: searchLead.name,
    avatar: searchLead.avatar,
    timestamp: new Date(),
    contact: dataResponse.key?.remoteJid,
  };

  // ------------------------------------------------------------
  // 🔥 Envia ao WebSocket correto
  // ------------------------------------------------------------
  const sessionId = searchLead.user_id;

  if (!sessionId || !sessions[sessionId]) {
    console.warn("⚠️ Sessão não encontrada:", sessionId);
  } else {
    //ensureContact(sessionId, remoteJid, result.lead?.name);
    //saveMessage(sessionId, remoteJid, finalMessage);

    const eventName =
      finalMessage.direction === "outgoing"
        ? "outgoing_message"
        : "incoming_message";

    global.io.to(sessions[sessionId].socketId).emit(eventName, finalMessage);
  }
};
