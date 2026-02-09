import { supabase } from "../config/supabaseClient.js";

export const createNewInbox = async ({ user_id }) => {
  const { data: newInbox, error: errorNew } = await supabase
    .from("integration_channels")
    .insert({ user_id, provider: "whatsapp" });

  return true;
};

export const createInbox = async ({ data }) => {
  const { data: newInbox, error: errorNew } = await supabase
    .from("integration_channels")
    .insert({
      user_id: data.user_id,
      provider: data.provider,
      product_id: data.product_id,
      name: data.name,
    });

  if (errorNew) throw errorNew;
  return true;
};

export const searchInbox = async ({ instance }) => {
  const { data: searchInbox, error: errorSearch } = await supabase
    .from("integration_channels")
    .select("user_id")
    .eq("user_id", instance)
    .maybeSingle();

  return searchInbox;
};

export const inboxWithProductSet = async ({ product_id }) => {
  const { data, error } = await supabase
    .from("integration_channels")
    .select("*")
    .eq("product_id", product_id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getInboxById = async ({ id }) => {
  const { data, error } = await supabase
    .from("integration_channels")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data;
};

export const listAllInboxesByUserId = async ({ id }) => {
  const { data, error } = await supabase
    .from("integration_channels")
    .select(
      `
      *,
      products (
        id,
        name,
        price,
        description
      )
    `
    )
    .eq("user_id", id);

  if (error) throw error;

  return data;
};

export const deleteInboxById = async ({ id }) => {
  const { data, error } = await supabase
    .from("integration_channels")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
};
