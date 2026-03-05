import { supabase } from "../config/supabaseClient.js";

export const getCredencialById = async ({ id }) => {
  const { data, error } = await supabase
    .from("configs_whatsapp_official")
    .select("*")
    .eq("id", id)
    .single();

  return data;
};

export const saveCredencial = async ({ data }) => {
  const { error } = await supabase
    .from("configs_whatsapp_official")
    .insert({
      user_id: data.user_id,
      waba_id: data.waba_id,
      token: data.token,
    })
    .select()
    .single();

  if (error) throw error;
};

export const getCredentialByUserId = async ({ userId }) => {
  const { data, error } = await supabase
    .from("configs_whatsapp_official")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;

  return data;
};

export const updateCredentialById = async ({ data }) => {
  const { data: updated, error } = await supabase
    .from("configs_whatsapp_official")
    .update({
      waba_id: data.waba_id,
      token: data.token,
      update_at: new Date().toISOString(), // opcional
    })
    .eq("id", data.id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar credential:", error);
    throw error;
  }

  return updated;
};

export const deleteCredentialById = async ({ id }) => {
  const { data: deleted, error } = await supabase
    .from("configs_whatsapp_official")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return deleted;
};
