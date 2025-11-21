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
    //`https://edvedder.encha.com.br/chat/fetchProfile/${instance}`,
    `http://localhost:8081/chat/fetchProfile/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
        apikey: "meu_token_secreto",
      },
      body: JSON.stringify({ number: phone }),
    }
  );

  const profile = await response.json();
  console.log(profile);

  const leadData = {
    user_id: searchInbox.user_id,
    name: profile.name || "lead_CRM",
    avatar: profile.picture,
    email: "",
    phone: phone,
    source: "crm",
  };
  console.log("LEAD CRIADO");
  console.log(leadData);

  const createNewLead = await leadModel.createLead({ data: leadData });

  if (!createNewLead) {
    throw new Error("Error ao criar novo lead.");
  }

  return createNewLead;
};
