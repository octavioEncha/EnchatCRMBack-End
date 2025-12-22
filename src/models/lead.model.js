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
      },
    ])
    .select();

  if (errorInsert) {
    throw new Error(errorInsert.message);
  }

  return createNewLead[0];
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
