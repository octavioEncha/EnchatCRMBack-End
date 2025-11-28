import { supabase } from "../config/supabaseClient.js";

export const findProfileById = async ({ id }) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  return profile;
};

export const findUserByEmail = async ({ email }) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  return profile;
};

export const updateTokenProfile = async ({ id, token }) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      apy_key: token,
    })
    .eq("id", id)
    .single();

  return profile;
};
