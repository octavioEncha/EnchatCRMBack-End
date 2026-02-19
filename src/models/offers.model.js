import { supabase } from "../config/supabaseClient.js";

export const findById = async (id) => {
  const { data: offer, error } = await supabase
    .from("offer")
    .select("*")
    .eq("id", id)
    .single();

  return offer ? offer : null;
};

export const createOffer = async ({ data }) => {
  const { data: offer, error } = await supabase
    .from("offer")
    .insert({
      user_id: data.user_id,
      product_id: data.product_id,
      name: data.name,
      orderbump_product_id: data.orderbump_product_id
        ? data.orderbump_product_id
        : null,
      upsell_product_id: data.upsell_product_id ? data.upsell_product_id : null,
      downsell_product_id: data.downsell_product_id
        ? data.downsell_product_id
        : null,
    })
    .select()
    .single();

  if (error) throw error;

  return offer;
};

export const getAllOffersByUserId = async (id) => {
  const { data: offers, error } = await supabase
    .from("offer")
    .select("*")
    .eq("user_id", id);

  if (error) throw error;

  return offers;
};

export const updateOfferById = async ({ id, data }) => {
  const { error } = await supabase
    .from("offer")
    .update({
      product_id: data.product_id,
      name: data.name,
      orderbump_product_id: data.orderbump_product_id
        ? data.orderbump_product_id
        : null,
      upsell_product_id: data.upsell_product_id ? data.upsell_product_id : null,
      downsell_product_id: data.downsell_product_id
        ? data.downsell_product_id
        : null,
    })
    .eq("id", id);

  if (error) throw error;
};

export const deleteOfferById = async ({ id }) => {
  const { error } = await supabase.from("offer").delete().eq("id", id);
  if (error) throw error;
};
