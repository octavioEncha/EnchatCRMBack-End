import { supabase } from "../config/supabaseClient.js";

export const createNewInbox = async ({ user_id }) => {
  const { data: newInbox, error: errorNew } = await supabase
    .from("integration_channels")
    .insert({ user_id, provider: "whatsapp" });

  return true;
};

export const createInbox = async ({ data }) => {
  const { data: newInbox, error } = await supabase
    .from("integration_channels")
    .insert({
      user_id: data.user_id,
      provider: data.provider,
      name: data.name,
      api_key: data.api_key,
      webhook_url: data.webhook_url,
      is_active: data.is_active,
      number: data.number,
      pipeline_id: data.pipeline_id,
    })
    .select()
    .single(); // 👈 retorna apenas um objeto

  if (error) throw error;

  return newInbox;
};

export const createRelationOfferInbox = async ({ inbox_id, offer_id }) => {
  const { error } = await supabase.from("offer_integration_channels").insert({
    offer_id,
    integration_channel_id: inbox_id,
  });

  if (error) throw error;

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

export const inboxWithPipelineSet = async ({ pipeline_id }) => {
  const { data, error } = await supabase
    .from("integration_channels")
    .select("*")
    .eq("pipeline_id", pipeline_id)
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
      pipeline:pipeline_id (
        id,
        name,
        description
      ),
      offer_integration_channels (
        offer (
          id,
          name,
          product:product_id ( name ),
          orderbump:orderbump_product_id ( name ),
          upsell:upsell_product_id ( name ),
          downsell:downsell_product_id ( name )
        )
      )
    `,
    )
    .eq("user_id", id);

  if (error) throw error;

  return data;
};

export const updateInboxById = async ({ id, data }) => {
  const { error } = await supabase
    .from("integration_channels")
    .update({
      name: data.name,
      api_key: data.api_key,
      webhook_url: data.webhook_url,
      is_active: data.is_active,
      number: data.number,
    })
    .eq("id", id);

  if (error) throw error;
  return true;
};

export const deleteRelationOfferInbox = async ({ inbox_id }) => {
  const { error } = await supabase
    .from("offer_integration_channels")
    .delete()
    .eq("integration_channel_id", inbox_id);

  if (error) throw error;

  return true;
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
