import { supabase } from "../config/supabaseClient.js";

export const searchInbox = async ({ instance }) => {
  const { data: searchInbox, error: errorSearch } = await supabase
    .from("integration_channels")
    .select("user_id")
    .eq("user_id", instance)
    .maybeSingle();

  return searchInbox;
};

export const createNewInbox = async ({ user_id }) => {
  const { data: newInbox, error: errorNew } = await supabase
    .from("integration_channels")
    .insert({ user_id, provider: "whatsapp" });

  return true;
};
