import * as wapModel from "../models/wap-oficial.model.js";
import { searchLead, createNewLeadByAPIOficial } from "./leads.service.js";
import {
  searchConversation,
  createNewConversation,
} from "./conversation.service.js";
import {
  createMessage,
  updateLastMessageTimestamp,
} from "../models/message.model.js";
import { sendMessageToClientConnected } from "./websocket.service.js";
import { setVerificationInInboxByMeta } from "./inbox.service.js";

import { verifyMessageById } from "./messages.service.js";

import Credential from "../entities/credencial-wap.entity.js";

const token =
  "Bearer EAAW6RYtQT9kBQ5Gr16xyQhlZBFmhbcNlsRIl7ZCXUh1R3QnYo6FvzzXM7dFgP3cb39oFRZABUJUFVcLZAQs87ajbMrCjhoAcZB8DGe3cmQy6KL6Jh50SyFUo3fHVKCowrCAzeSZBZAhT7Mwqns80y3tyf3UWXEkrRebhh8T5FwaIW0ZBLZCywoJHhTExcUlYPaZAvegwZDZD";

const waba_id = "26801374196130743";

//TEMPLATE

export const getAllTemplatesByUserId = async ({ id }) => {
  const credentials = await getCredentialByUserId({ userId: id });

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${credentials?.waba_id}/message_templates`,
    {
      headers: {
        Authorization: "Bearer " + credentials?.token,
      },
    }
  );

  const templatesData = await response.json();

  return templatesData.data || [];
};

export const createNewTemplate = async ({ data }) => {
  console.log(data);

  const credentials = await getCredentialByUserId({ userId: data?.userId });

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${credentials.waba_id}/message_templates`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + credentials?.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Erro ao criar template");
  }

  return result;
};

export const deleteTemplateById = async (templateId, name) => {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${waba_id}/message_templates?hsm_id=${templateId}&name=${name}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Erro ao deletar template");
  }

  return result;
};

//CREDENTIAL

export const getCredencialById = async ({ id }) => {
  const credencial = await wapModel.getCredencialById({ id });

  if (!credencial) throw new Error("Credential not found!");

  return new Credential(credencial);
};

export const setCredencial = async ({ data }) => {
  const credential = new Credential(data);

  return await wapModel.saveCredencial({ data });
};

export const getCredentialByUserId = async ({ userId }) => {
  const credentials = await wapModel.getCredentialByUserId({ userId });

  if (!credentials || credentials.length === 0) {
    throw new Error("Credential not found for this user");
  }

  const credential = credentials[0]; // 👈 pega o objeto

  return new Credential({
    id: credential.id,
    user_id: credential.user_id,
    waba_id: credential.waba_id,
    token: credential.token,
    created_at: credential.created_at,
    updated_at: credential.updated_at,
  });
};

export const updateCredentialById = async ({ credentialId, data }) => {
  const credential = new Credential({
    id: credentialId,
    ...data,
  });

  return await wapModel.updateCredentialById({ data: credential });
};

export const deleteCredentialById = async ({ id }) => {
  const credential = await getCredencialById({ id });

  return await wapModel.deleteCredentialById({ id: credential.id });
};

//WEBHOOK

export const setVerification = async ({ inboxId }) => {
  console.log("WAP SERVICE");
  await setVerificationInInboxByMeta({ inboxId });
};

//const verifyMessage = await verifyMessageById({ messageId });

//if (verifyMessage) {
//  return null;
//}

export const receiveMessages = async ({ inboxId, data }) => {
  const value = data?.[0]?.body?.entry?.[0]?.changes?.[0]?.value;

  if (!value?.messages) {
    console.log("Nenhuma mensagem recebida.");
    return;
  }

  const message = value.messages[0];
  const contact = value.contacts?.[0];

  const messageType = message.type;
  const messageId = message.id;
  const senderName = contact?.profile?.name;
  const senderPhone = contact?.wa_id;

  let lead = "";

  lead = await searchLead({
    phone: senderPhone,
    instance: inboxId,
  });

  if (!lead) {
    lead = await createNewLeadByAPIOficial({
      phone: senderPhone,
      name: senderName,
      instance: inboxId,
    });
  }

  let conversation = await searchConversation({ lead_id: lead.id });

  if (!conversation) {
    const conversationData = {
      inbox_id: inboxId,
      lead_id: lead.id,
    };
    conversation = await createNewConversation({ data: conversationData });
  }

  if (messageType === "text") {
    const message = data[0].messages[0].text.body;

    const createdNewMessage = await createMessage({
      data: {
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox: inboxId,
        senderType: "lead",
        mediaType: "text",
        messageContent: message,
        messageId,
      },
    });

    if (!createdNewMessage) throw new Error("Erro ao salvar mensagem");
    await updateLastMessageTimestamp({
      conversationId: conversation.id,
    });

    const finalMessage = {
      id: createdNewMessage.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      direction: "incoming",
      text: message,
      timestamp: new Date(),
      contact: lead.phone,
      user: lead.name,
      avatar: lead.avatar,
      ai_enabled: conversation.ai_enabled,
    };

    await sendMessageToClientConnected({ instance: inboxId, finalMessage });
  }
};
