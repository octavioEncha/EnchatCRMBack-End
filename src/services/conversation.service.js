import { supabase } from "../config/supabaseClient.js";

export const listAllConversation = async ({ user_id }) => {
  try {
    // 1. Buscar conversas do usuário
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user_id)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar conversas:", error.message);
      return [];
    }

    // 2. Para cada conversa, buscar a última mensagem
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          lastMessage,
        };
      })
    );
    console.log(results);
    return results;
  } catch (err) {
    console.error("Erro inesperado ao buscar conversa:", err.message);
    return [];
  }
};

export const searchConversation = async ({ lead_id }) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("lead_id", lead_id)
      .maybeSingle();
    console.log(data);
    if (error) {
      console.error("❌ Erro ao buscar lead:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Erro inesperado ao buscar conversa:", err.message);
    return null;
  }
};

export const createNewConversation = async ({ data }) => {
  console.log(data);

  try {
    const { data: createNewConversation, error } = await supabase
      .from("conversations")
      .insert({
        user_id: data.user_id,
        lead_id: data.lead_id,
      })
      .select();

    return createNewConversation?.[0] || null;
  } catch (err) {
    console.error("Erro inesperado ao criar conversation:", err.message);
    return null;
  }
};
