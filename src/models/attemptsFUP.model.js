import { supabase } from "../config/supabaseClient.js";

export const createAttempsFUP = async ({ data }) => {
  const { data: attemptsFUP, error } = await supabase
    .from("attempts_fup")
    .insert({
      fup_id: data.fup_id,
      message: data.message,
      rest: data.rest,
      rest_unit: data.rest_unit,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
};

export const deleteByFollowUpId = async ({ id }) => {
  const { error } = await supabase
    .from("attempts_fup")
    .delete()
    .eq("fup_id", id);

  if (error) throw new Error(error.message);
};
