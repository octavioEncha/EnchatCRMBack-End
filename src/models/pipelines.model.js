import { supabase } from "../config/supabaseClient.js";

export const searchPipelineIsdefault = async ({ user_id }) => {
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("user_id", user_id)
    .eq("is_default", true)
    .maybeSingle(); // retorna apenas um resultado

  if (error) throw error;

  return data;
};

export const seachPipelineById = async ({ id }) => {
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getPipelinesWithProductsSet = async ({ id }) => {
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("product_id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getPipelineByUserId = async ({ id }) => {
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
};
