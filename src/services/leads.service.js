import * as leadModel from "../models/lead.model.js";
import * as inboxModel from "../models/inbox.model.js";

export const searchLead = async ({ phone }) => {
  const lead = await leadModel.searchLeadPhone({ phone });

  return lead;
};

export const searchLeadId = async ({ id }) => {
  const searchLeadId = await leadModel.searchLeadId({ id });

  if (!searchLeadId) {
    console.error("❌ Lead não encontrado");
    return null;
  }

  return searchLeadId;
};

export const createNewLead = async ({ data, phone, instance }) => {
  // remove tudo que não for número
  const searchInbox = await inboxModel.searchInbox({ instance });

  if (!searchInbox) {
    throw new Error("❌ Erro ao buscar canal:");
  }
  const response = await fetch(
    `http://localhost:8081/chat/fetchProfile/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "meu_token_secreto",
      },
      body: JSON.stringify({ number: phone }),
    }
  );
  const profile = await response.json();

  const leadData = {
    user_id: searchInbox.user_id,
    name: profile.name || "lead_CRM",
    avatar: profile.picture,
    email: "",
    phone: phone,
    source: "crm",
  };

  const createNewLead = await leadModel.createLead({ data: leadData });

  if (!createNewLead) {
    throw new Error("Error ao criar novo lead.");
  }

  return createNewLead;
};
