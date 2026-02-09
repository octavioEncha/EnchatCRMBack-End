import { supabase } from "../config/supabaseClient.js";

export const listAllConversation = async ({ inbox_id }) => {
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("inbox_id", inbox_id)
    .order("last_message_at", { ascending: false });

  return conversations;
};

export const searchConversation = async ({ lead_id }) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", lead_id)
    .maybeSingle();

  return data;
};

export const createNewConversation = async ({ data }) => {
  const { data: convData, error: errorInsert } = await supabase
    .from("conversations")
    .insert({
      user_id: data.user_id,
      lead_id: data.lead_id,
      ai_enabled: data.is_active,
      inbox_id: data.inbox_id,
    })
    .select()
    .maybeSingle();

  // ⚠️ Erro ao inserir
  if (errorInsert) {
    // 🔥 Erro de duplicado
    if (errorInsert.code === "23505") {
      console.log("⚠️ Conversa já existe. Retornando conversa existente…");

      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", data.user_id)
        .eq("lead_id", data.lead_id)
        .maybeSingle();

      return existingConv;
    }

    // outros erros
    throw new Error(errorInsert.message);
  }

  return convData;
};

export const searchConversationId = async ({ id }) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data;
};
