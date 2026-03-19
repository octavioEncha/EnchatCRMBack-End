import * as messageService from "./messages.service.js";
import {
  searchLeadByInstagramId,
  createLeadByReceiveInstagramContent,
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

export const receiveMessageByWebhook = async ({ inbox_id, data }) => {
  const inbox = await findInboxByIdOrThrow({ id: inbox_id });

  const value = data?.entry[0];

  const messageId = value.messaging[0].message.mid;

  //if (await messageService.verifyMessageById({ messageId })) return null;

  const pageId = value.id;

  await setInstagramIdByWebhookReceive({ inboxId: inbox.id, id: pageId });

  const senderId = value.messaging[0].sender.id;
  const recipientId = value.messaging[0].recipient.id;

  const fromMe = recipientId === pageId ? "lead" : "user";

  let lead = await searchLeadByInstagramId({
    id: recipientId === pageId ? senderId : recipientId,
  });

  if (!lead) {
    const profile = await getInformationsByInstagramId({
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
        company: null,
        tags: [],
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

  //CONTENT TYPE  = TEXT
  const messageContent = value.messaging[0].message.text;
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

const getInformationsByInstagramId = async ({ id }) => {
  const response = await fetch(
    `https://graph.instagram.com/v25.0/${id}?fields=id,username&access_token=IGAANJmCZARxANBZAFpWQ0dwa2w3V3EwQ1MtQ0FVaE5PUHdvUHEyWVpRbFF6ZAlJKQXhGdmM2MHZAma1pHUmpJek9pMlNKSVV1WE40MjBqeFBkRnRpOWE3dFZAWQkhzQnBLNXpFQUo5VGtqc2ZASVVdiS2RmQVVIV0ZA3R0lrSkUyOTAyRQZDZD`,
  );

  const data = await response.json();

  return data;
};

export const sendMessage = async ({ inbox, userId, lead, text }) => {
  console.log(inbox);
  console.log(userId);
  console.log(lead);
  console.log(text);

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
};

export const setVerification = async ({ inboxId }) => {
  await setVerificationInInboxByMeta({ inboxId });
};
