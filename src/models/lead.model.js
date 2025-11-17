import { supabase } from "../config/supabaseClient.js";

export const searchLeadPhone = async ({ phone }) => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("phone", phone)
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
        email: "",
        phone: data.phone,
        source: "crm",
      },
    ])
    .select();

  return createNewLead[0];
};
