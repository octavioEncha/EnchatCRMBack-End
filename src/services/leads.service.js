import XLSX from "xlsx";

import * as leadModel from "../models/lead.model.js";
import * as inboxModel from "../models/inbox.model.js";
import {
  getPipelinesWithProductsSet,
  seachPipelineById,
} from "./pipeline.service.js";
import { findInboxByIdOrThrow } from "./inbox.service.js";

/* =====================================================
   NORMALIZADOR DE TELEFONE (PADRÃO BRASIL)
   ===================================================== */
const normalizePhone = (phone) => {
  if (!phone) return null;

  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // Remove 55 se já existir
  if (digits.startsWith("55")) {
    digits = digits.substring(2);
  }

  // Agora temos DDD + número
  if (digits.length === 10) {
    const firstDigit = digits.charAt(2);

    // Fixo (2-5) → não adiciona 9
    if (firstDigit >= "2" && firstDigit <= "5") {
      return "55" + digits;
    }

    // Celular antigo → adiciona 9
    digits = digits.substring(0, 2) + "9" + digits.substring(2);
  }

  return "55" + digits;
};

/* =====================================================
   SEARCH LEAD
   ===================================================== */
export const searchLead = async ({ phone, instance }) => {
  const inbox = await findInboxByIdOrThrow({ id: instance });

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const lead = await leadModel.searchLeadPhone({
    phone: normalizedPhone,
    instance: inbox.user_id,
  });

  return lead;
};

/* =====================================================
   SEARCH LEAD BY ID
   ===================================================== */
export const searchLeadId = async ({ id }) => {
  const searchLeadId = await leadModel.searchLeadId({ id });

  if (!searchLeadId) {
    console.error("❌ Lead não encontrado");
    return null;
  }

  return searchLeadId;
};

/* =====================================================
   CREATE NEW LEAD
   ===================================================== */
export const createNewLead = async ({ data, phone, instance, lid }) => {
  const searchInbox = await findInboxByIdOrThrow({ id: instance });

  if (!searchInbox) {
    throw new Error("❌ Erro ao buscar canal");
  }

  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    throw new Error("Telefone inválido");
  }

  // 🔥 Verifica duplicidade antes de criar
  const existingLead = await leadModel.searchLeadPhone({
    phone: normalizedPhone,
    instance: searchInbox.user_id,
  });

  if (existingLead) {
    return existingLead;
  }

  const searchPipeline = await seachPipelineById({
    id: searchInbox.pipeline_id,
  });

  const response = await fetch(
    `https://edvedder.encha.com.br/chat/fetchProfile/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
      },
      body: JSON.stringify({ number: normalizedPhone }),
    },
  );

  const profile = await response.json();

  const leadData = {
    user_id: searchInbox.user_id,
    name: profile.name || normalizedPhone,
    avatar:
      profile.picture ||
      "https://oxhjqkwdjobrhtwfwhnz.supabase.co/storage/v1/object/public/logo/4.png",
    email: "",
    phone: normalizedPhone,
    source: "crm",
    lid,
    pipeline_id: searchPipeline.id,
  };

  const newLead = await leadModel.createLead({ data: leadData });

  if (!newLead) {
    throw new Error("Erro ao criar novo lead.");
  }

  return newLead;
};

/* =====================================================
   IMPORT LEADS VIA XLSX
   ===================================================== */
export const importLead = async ({ file, pipelineId }) => {
  if (!file || !file.path) {
    throw new Error("Arquivo inválido.");
  }

  const searchPipeline = await seachPipelineById({ id: pipelineId });
  const instance = searchPipeline.user_id;

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
    if (importedCount >= limit) break;

    if (!item.nome || !item.email || !item.telefone) {
      errors.push({ item, error: "Dados incompletos" });
      continue;
    }

    const phone = normalizePhone(item.telefone);

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
    } catch {
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

/* =====================================================
   PREVIEW IMPORT LIMIT
   ===================================================== */
export const previewImportLeads = async ({ id }) => {
  const searchPipeline = await seachPipelineById({ id });
  const instance = searchPipeline.user_id;

  const leadCount = await leadModel.countLeadsByUserId({ user_id: instance });

  return 1000 - leadCount.length;
};
