import { supabase } from "../config/supabaseClient.js";

export const listAllConversation = async ({ user_id }) => {
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user_id)
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
  const { data: createNewConversation, error } = await supabase
    .from("conversations")
    .insert({
      user_id: data.user_id,
      lead_id: data.lead_id,
    })
    .select();

  return createNewConversation;
};
