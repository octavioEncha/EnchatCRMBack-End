import { supabase } from "../config/supabaseClient.js";
export const getAIConfigurationByProfileId = async ({ id }) => {
  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (error) {
    console.log(error);
  }
  return data;
};

export const updateConfigIA = async ({ id_profile, data }) => {
  const { data: updateConfig, error } = await supabase
    .from("profiles")
    .update({
      webhook_url: data.webhook_url,
      ia_active: data.is_active,
    })
    .eq("id", id_profile)
    .maybeSingle();

  if (error) {
    throw new Error(error);
  }

  return updateConfig;
};
