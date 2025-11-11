import { supabase } from "../config/supabaseClient.js";

export const searchLead = async ({ phone }) => {
  try {
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
  } catch (err) {
    console.error("Erro inesperado ao buscar lead:", err.message);
    return null;
  }
};

export const searchLeadId = async ({ id }) => {
  console.log(id);
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle(); // ✅ retorna null se não encontrar
    if (error) {
      console.error("❌ Erro ao buscar lead:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Erro inesperado ao buscar lead:", err.message);
    return null;
  }
};

export const createNewLead = async ({ data, phone }) => {
  try {
    const phoneBox = data?.sender?.replace(/\D/g, ""); // remove tudo que não for número

    // 1️⃣ Verifica se o canal de integração existe
    const { data: searchInbox, error: errorSearch } = await supabase
      .from("integration_channels")
      .select("user_id")
      .eq("number", phoneBox)
      .maybeSingle();

    if (errorSearch) {
      console.error("❌ Erro ao buscar canal:", errorSearch.message);
      return null;
    }

    const name = data.data.pushName;

    console.log(data);

    // 2️⃣ Cria o lead
    const { data: insertedLead, error: errorInsert } = await supabase
      .from("leads")
      .insert([
        {
          user_id: searchInbox.user_id,
          name: name || "...",
          avatar: data.avatar,
          email: "",
          phone: phone,
          source: "website",
        },
      ])
      .select(); // retorna o lead criado

    console.log(insertedLead);

    if (errorInsert) {
      console.error("❌ Erro ao criar lead:", errorInsert.message);
      return null;
    }

    return insertedLead?.[0] || null;

    /*
     */
  } catch (err) {
    console.error("⚠️ Erro inesperado ao criar lead:", err.message);
    return null;
  }
};
