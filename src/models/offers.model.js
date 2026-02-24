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

export const createOfferOrderBumps = async ({
  offer_id,
  orderbump_product_id,
}) => {
  const { error } = await supabase
    .from("offer_order_bumps")
    .insert({
      offer_id,
      oderbump_product_id: orderbump_product_id,
    })
    .select()
    .single();

  if (error) throw new error();

  return true;
};

export const getAllOffersByUserId = async (id) => {
  const { data, error } = await supabase
    .from("offer")
    .select(
      `
      *,
      orderbump_product_ids:offer_order_bumps (
        id,
        oderbump_product_id
      
      )
    `,
    )
    .eq("user_id", id);

  if (error) throw error;

  return data;
};

export const getAllOffersAndProductsByInboxId = async ({ inbox_id }) => {
  const { data, error } = await supabase
    .from("offer_integration_channels")
    .select(
      `
      id,
      created_at,
      integration_channels (
        id,
        name,
        provider,
        is_active,
        number,
        webhook_url,
        prompt
      ),
      offer (
        id,
        name,
        created_at,

        product:products!offer_product_id_fkey (
          id,
          name,
          price,
          description,
          payment_link
        ),

        upsell_product:products!offer_upsell_product_id_fkey (
          id,
          name,
          price,
          description,
          payment_link
        ),

        downsell_product:products!offer_downsell_product_id_fkey (
          id,
          name,
          price,
          description,
          payment_link
        ),

        order_bumps:offer_order_bumps (
          id,
          created_at,
          product:products!offer_order_bumps_oderbump_product_id_fkey (
            id,
            name,
            price,
            description,
            payment_link
          )
        )
      )
    `,
    )
    .eq("integration_channel_id", inbox_id);

  if (error) throw error;

  return data;
};

export const updateOfferById = async ({ id, data }) => {
  const { error } = await supabase
    .from("offer")
    .update({
      product_id: data.product_id,
      name: data.name,
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

export const deleteOfferOderBumpByOfferId = async ({ id }) => {
  const { error } = await supabase
    .from("offer_order_bumps")
    .delete()
    .eq("offer_id", id);
  if (error) throw error;
};
