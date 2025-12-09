import XLSX from "xlsx";

import * as leadModel from "../models/lead.model.js";
import * as inboxModel from "../models/inbox.model.js";
import {
  searchPipelineIsdefault,
  seachPipelineById,
} from "./pipeline.service.js";

//ARRUMAR PARA ALÉM DE ENVIAR O NÚMERO, ENVIAR O USER_ID
export const searchLead = async ({ phone, instance }) => {
  const lead = await leadModel.searchLeadPhone({ phone, instance });

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

export const createNewLead = async ({ data, phone, instance, lid }) => {
  // remove tudo que não for número
  const searchInbox = await inboxModel.searchInbox({ instance });

  if (!searchInbox) {
    throw new Error("❌ Erro ao buscar canal:");
  }

  const searchPipeline = await searchPipelineIsdefault({
    user_id: searchInbox.user_id,
  });

  const response = await fetch(
    `https://edvedder.encha.com.br/chat/fetchProfile/${instance}`,
    //`http://localhost:8081/chat/fetchProfile/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
        //apikey: "meu_token_secreto",
      },
      body: JSON.stringify({ number: phone }),
    }
  );

  const profile = await response.json();

  const leadData = {
    user_id: searchInbox.user_id,
    name: profile.name || String(phone),
    avatar:
      profile.picture ||
      "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
    email: "",
    phone: phone,
    source: "crm",
    lid,
    pipeline_id: searchPipeline.id,
  };

  const createNewLead = await leadModel.createLead({ data: leadData });
  console.log(createNewLead);
  if (!createNewLead) {
    throw new Error("Error ao criar novo lead.");
  }

  return createNewLead;
};

export const importLead = async ({ file, pipelineId }) => {
  try {
    if (!file || !file.path) {
      throw new Error("Arquivo inválido.");
    }

    const searchPipelin = await seachPipelineById({ id: pipelineId });

    const instance = searchPipelin.user_id;

    const { readFile, utils } = XLSX;

    // 📌 Lê o arquivo XLSX (AGORA CERTO)
    const workBook = readFile(file.path);

    const sheetName = workBook.SheetNames[0];
    const worksheet = workBook.Sheets[sheetName];

    const rows = utils.sheet_to_json(worksheet, { defval: "" });

    for (const item of rows) {
      const response = await fetch(
        `https://edvedder.encha.com.br/chat/fetchProfile/${instance}`,
        //`http://localhost:8081/chat/fetchProfile/${instance}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
            //apikey: "meu_token_secreto",
          },
          body: JSON.stringify({
            number: String(item.telefone).replace(/\D/g, ""),
          }),
        }
      );

      const profile = await response.json();

      const leadData = {
        user_id: instance,
        name: item.nome || item.telefone.replace(/\D/g, ""),
        avatar:
          profile.picture ||
          "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
        email: item.email,
        phone: String(item.telefone).replace(/\D/g, ""),
        source: "crm",
        lid: "",
        pipeline_id: pipelineId,
        company: item.empresa,
        value: item.valor,
        notes: item.notas,
        tags: String(item.tags)
          .split(",") // separa por vírgulas
          .map((tag) => tag.trim()) // remove espaços
          .filter((tag) => tag !== ""), // remove vazios
      };

      const createNewLead = await leadModel.createLead({ data: leadData });
    }

    return true;
  } catch (err) {
    throw new Error(err.message);
  }
};
