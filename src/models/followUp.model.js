import { supabase } from "../config/supabaseClient.js";

export const getFollowUpById = async ({ id }) => {
  const { data, error } = await supabase
    .from("follow_up")
    .select(
      `
      *,
      steps: attempts_fup (*)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data ? data : null;
};

export const createFollowUp = async ({ data }) => {
  const { data: fup, error } = await supabase
    .from("follow_up")
    .insert({
      user_id: data.user_id,
      offer_id: data.offer_id,
      name: data.name,
      step: data.step,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return fup;
};

export const listAllFollowUpByOfferId = async ({ id }) => {
  const { data, error } = await supabase
    .from("follow_up")
    .select(
      `
      *,
      steps:attempts_fup (*)
    `,
    )
    .eq("offer_id", id);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const updateFollowUpById = async ({ id, data }) => {
  const { error } = await supabase
    .from("follow_up")
    .update({
      name: data.name,
      step: data.step,
      update_at: new Date(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
};

export const deleteFollowUpById = async ({ id }) => {
  const { error } = await supabase.from("follow_up").delete().eq("id", id);

  if (error) throw new Error(error.message);
};
