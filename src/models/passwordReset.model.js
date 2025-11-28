import { supabase } from "../config/supabaseClient.js";

export const saveTokenResetPassword = async ({ data }) => {
  const { data: savedToken, error } = await supabase
    .from("passwordReset")
    .upsert(
      {
        email: data.email,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      { onConflict: ["email"] }
    );

  if (error) {
    console.error("Erro ao salvar token:", error);
    throw error;
  }

  return savedToken;
};

export const verifyToken = async ({ token }) => {
  const { data, error } = await supabase
    .from("passwordReset")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("Erro ao salvar token:", error);
    throw error;
  }

  return data;
};

export const updatePassword = async ({ user_id, password }) => {
  const { data, error } = await supabase.auth.admin.updateUserById(user_id, {
    password: password,
  });

  if (error) throw error;

  return data;
};
