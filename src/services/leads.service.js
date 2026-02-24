import XLSX from "xlsx";

import * as leadModel from "../models/lead.model.js";
import * as inboxModel from "../models/inbox.model.js";
import {
  getPipelinesWithProductsSet,
  seachPipelineById,
} from "./pipeline.service.js";
import { findInboxByIdOrThrow } from "./inbox.service.js";

//ARRUMAR PARA ALÉM DE ENVIAR O NÚMERO, ENVIAR O USER_ID
export const searchLead = async ({ phone, instance }) => {
  const inbox = await findInboxByIdOrThrow({ id: instance });

  const lead = await leadModel.searchLeadPhone({
    phone,
    instance: inbox.user_id,
  });

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
  const searchInbox = await findInboxByIdOrThrow({ id: instance });

  if (!searchInbox) {
    throw new Error("❌ Erro ao buscar canal:");
  }

  const searchPipeline = await seachPipelineById({
    id: searchInbox.pipeline_id,
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
    },
  );

  const profile = await response.json();

  console.log(profile);

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
    //pipeline_id: null,
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
  if (!file || !file.path) {
    throw new Error("Arquivo inválido.");
  }

  const searchPipeline = await seachPipelineById({ id: pipelineId });
  const instance = searchPipeline.user_id;

  // Quantos ainda podem ser importados
  const leadCount = await leadModel.countLeadsByUserId({ user_id: instance });
  const limit = Math.max(0, 1000 - leadCount.length);

  if (limit === 0) {
    return {
      importedCount: 0,
      errors: [{ error: "Limite máximo de leads atingido" }],
    };
  }

  const { readFile, utils } = XLSX;

  const workBook = readFile(file.path);
  const sheetName = workBook.SheetNames[0];
  const worksheet = workBook.Sheets[sheetName];

  const rows = utils.sheet_to_json(worksheet, { defval: "" });

  let importedCount = 0;
  let errors = [];

  for (const item of rows) {
    // 🛑 Para quando bater o limite de SUCESSO
    if (importedCount >= limit) {
      break;
    }

    // ✅ Validação correta
    if (!item.nome || !item.email || !item.telefone) {
      errors.push({ item, error: "Dados incompletos" });
      continue;
    }

    const phone = String(item.telefone).replace(/\D/g, "");
    if (!phone) {
      errors.push({ item, error: "Telefone inválido" });
      continue;
    }

    const leadExisting = await leadModel.searchLeadPhone({
      phone,
      instance,
    });

    if (leadExisting) {
      errors.push({ item, error: "Lead já existe" });
      continue;
    }

    const value =
      item.valor === "" || item.valor === null || item.valor === undefined
        ? null
        : Number(item.valor);

    // 🔥 Só busca profile se realmente vai salvar
    let profile = {};
    try {
      const response = await fetch(
        `https://edvedder.encha.com.br/chat/fetchProfile/${instance}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
          },
          body: JSON.stringify({ number: phone }),
        },
      );

      profile = await response.json();
    } catch (err) {
      // não quebra a importação por causa disso
      profile = {};
    }

    const leadData = {
      user_id: instance,
      name: item.nome || phone,
      avatar:
        profile.picture ||
        "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
      email: item.email || null,
      phone,
      source: "crm",
      lid: "",
      pipeline_id: pipelineId,
      company: item.empresa || null,
      value,
      notes: item.notas || null,
      tags: String(item.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      lead_type: "contact",
    };

    await leadModel.createLead({ data: leadData });
    importedCount++;
  }

  return {
    importedCount,
    errors,
    skipped: rows.length - importedCount - errors.length,
    limit,
  };
};

export const previewImportLeads = async ({ id }) => {
  const searchPipelin = await seachPipelineById({ id });

  const instance = searchPipelin.user_id;

  const leadCount = await leadModel.countLeadsByUserId({ user_id: instance });

  const result = 1000 - leadCount.length;

  return result;
};
