import { supabase } from "../config/supabaseClient.js";

export const searchLeadPhone = async ({ phone, instance }) => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("phone", phone)
    .eq("user_id", instance)
    .maybeSingle(); // ✅ retorna null se não encontrar
  if (error) {
    console.error("❌ Erro ao buscar lead:", error.message);
    return null;
  }

  return data;
};

export const searchLeadByInstagramId = async ({ id }) => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("instagram_id", id)
    .maybeSingle();
  return data;
};

export const searchLeadId = async ({ id }) => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
};

export const createLead = async ({ data }) => {
  const { data: createNewLead, error: errorInsert } = await supabase
    .from("leads")
    .insert([
      {
        user_id: data.user_id,
        name: data.name,
        avatar: data.avatar,
        email: data.email ?? null, // ✅
        phone: data.phone,
        source: "crm",
        lid: data.lid,
        pipeline_id: data.pipeline_id,
        company: data.company ?? null, // ✅
        value: typeof data.value === "number" ? data.value : null, // ✅ CRÍTICO
        notes: data.notes ?? null, // ✅
        tags: Array.isArray(data.tags) ? data.tags : [], // ✅
        company: data.company || "",
        value: data.value || null,
        notes: data.notes || "",
        tags: data.tags || [],
        lead_type: data?.lead_type || "lead",
      },
    ])
    .select()
    .maybeSingle();

  // ⚠️ erroInsert é o nome correto
  if (errorInsert) {
    // 🔥 ERRO DE DUPLICADO — código 23505
    if (errorInsert.code === "23505") {
      console.log("⚠️ Lead já existe. Retornando lead existente…");

      // retorna o lead existente
      const { data: existingLead } = await supabase
        .from("leads")
        .select("*")
        .eq("phone", data.phone)
        .eq("user_id", data.user_id)
        .maybeSingle();
      console.log(existingLead);
      return existingLead;
    }

    // outros erros
    throw new Error(errorInsert.message);
  }

  // retorno normal
  return createNewLead;
};

export const createLeadByReceiveInstagramContent = async ({ data }) => {
  const { data: createNewLead, error: errorInsert } = await supabase
    .from("leads")
    .insert([
      {
        user_id: data.user_id,
        name: data.name,
        avatar: data.avatar,
        email: data.email ?? null,
        phone: data.phone ?? null,
        source: "crm",
        lid: data.lid ?? null,
        pipeline_id: data.pipeline_id ?? null,
        company: data.company ?? null,
        value: typeof data.value === "number" ? data.value : null,
        notes: data.notes ?? null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        lead_type: data?.lead_type || "lead",
        instagram_id: data?.instagram_id,
      },
    ])
    .select()
    .maybeSingle();

  if (errorInsert) {
    console.error("Erro ao inserir lead:", errorInsert);
    return;
  }

  console.log(createNewLead);
  return createNewLead;
};

export const countLeadsByUserId = async ({ user_id }) => {
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("user_id", user_id);

  if (error) {
    console.error("❌ Erro ao contar leads:", error.message);
    return 0;
  }
  return data;
};
