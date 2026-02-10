import { supabase } from "../config/supabaseClient.js";

export const listAllFollowUpByProductId = async ({ id }) => {
  const { data, error } = await supabase
    .from("pipeline_fups")
    .select("*")
    .eq("product_id", id);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const listFollowUpById = async ({ id }) => {
  const { data, error } = await supabase
    .from("pipeline_fups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data;
};

export const updateFollowUpById = async ({ data }) => {
  const { error } = await supabase
    .from("pipeline_fups")
    .update({
      message_template: data.message_template,
      delay_hours: data.delay_hours,
    })
    .eq("id", data.id);

  if (error) {
    throw error;
  }

  return true;
};
