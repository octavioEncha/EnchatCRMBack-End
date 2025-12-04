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

export const createUser = async ({ data }) => {
  const { data: createProfile, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) throw new Error(error);

  return createProfile;
};

export const updateProfileName = async ({ id, name }) => {
  const { data: updateProfile, error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
    })
    .eq("id", id)
    .single();

  if (error) throw new Error(error);

  return updateProfile;
};
