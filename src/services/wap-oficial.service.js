import * as wapModel from "../models/wap-oficial.model.js";
import {
  searchLead,
  createNewLeadByAPIOficial,
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
} from "../models/message.model.js";
import { sendMessageToClientConnected } from "./websocket.service.js";
import {
  setVerificationInInboxByMeta,
  findInboxByIdOrThrow,
} from "./inbox.service.js";
import * as messageService from "./messages.service.js";

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

export const receiveMessages = async ({ inboxId, data }) => {
  const value = data?.entry?.[0]?.changes?.[0]?.value; // ✅ Caminho correto

  if (!value?.messages) {
    console.log("Nenhuma mensagem recebida.");
    return;
  }

  const message = value.messages[0];
  const contact = value.contacts?.[0];

  const messageId = message.id;

  const verifyMessage = await message.servicesssa({ messageId });

  if (verifyMessage) {
    return null;
  }

  const messageType = message.type;

  const senderName = contact?.profile?.name;
  const senderPhone = contact?.wa_id;

  let lead = await searchLead({ phone: senderPhone, instance: inboxId });

  if (!lead) {
    lead = await createNewLeadByAPIOficial({
      phone: senderPhone,
      name: senderName,
      instance: inboxId,
    });
  }

  let conversation = await searchConversation({ lead_id: lead.id });

  if (!conversation) {
    conversation = await createNewConversation({
      data: { inbox_id: inboxId, lead_id: lead.id },
    });
  }

  if (messageType === "text") {
    const messageContent = message.text.body;

    const createdNewMessage = await createMessage({
      data: {
        conversation_id: conversation.id,
        lead_id: lead.id,
        inbox: inboxId,
        senderType: "lead",
        mediaType: "text",
        messageContent,
        messageId,
      },
    });

    if (!createdNewMessage) throw new Error("Erro ao salvar mensagem");

    await updateLastMessageTimestamp({ conversationId: conversation.id });

    await updateLastMessageInboundTimestamp({
      conversationId: conversation.id,
    });

    const now = new Date().toISOString();

    const finalMessage = {
      id: createdNewMessage.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      inbox_provider: "whatsapp_official",
      direction: "incoming",
      text: messageContent,
      timestamp: now,
      contact: lead.phone,
      last_inbound_message_at: now,
      user: lead.name,
      avatar: lead.avatar,
      ai_enabled: conversation.ai_enabled,
    };

    console.log(finalMessage);
    await sendMessageToClientConnected({ instance: inboxId, finalMessage });
  }
};

export const sendMessageWith24HoursContext = async ({
  inbox,
  userId,
  phone,
  text,
}) => {
  if (!userId) {
    throw new Error("userId não foi informado");
  }

  const credential = await getCredentialByUserId({
    userId: userId,
  });

  const response = await fetch(
    "https://graph.facebook.com/v22.0/" + inbox.phone_number_id + "/messages",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + credential.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: text,
        },
      }),
    }
  );

  if (!response.ok) {
    console.log(await response.json());
  }
};

export const sendTemplateForClientNumber = async ({ data }) => {
  const inbox = await findInboxByIdOrThrow({ id: data.inbox_id });

  const credential = await getCredentialByUserId({
    userId: inbox.user_id,
  });

  const lead = await searchLeadId({ id: data.lead_id });

  const response = await fetch(
    "https://graph.facebook.com/v22.0/" + inbox.phone_number_id + "/messages",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + credential.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: lead.phone,
        type: "template",
        template: {
          name: data.template_name,
          language: {
            code: data.template_language,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data);
  }

  const templates = await getAllTemplatesByUserId({ id: inbox.user_id });

  const templatefiltred = templates.find(
    (template) => template.name === data.template_name
  );

  const header =
    templatefiltred.components.find((c) => c.type === "HEADER")?.text || "";
  const body =
    templatefiltred.components.find((c) => c.type === "BODY")?.text || "";
  const footer =
    templatefiltred.components.find((c) => c.type === "FOOTER")?.text || "";

  const content = [header, body, footer].filter(Boolean).join("\n\n");

  const newData = {
    content,
    inbox: inbox.id,
    lead: lead,
  };

  await messageService.saveMessageAndSendToClientWebSocket({ data: newData });
};
