import { supabase } from "../config/supabaseClient.js";

const searchPipelineIsdefault = async ({ user_id }) => {
  const { data, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("user_id", user_id)
    .eq("is_default", true)
    .maybeSingle(); // retorna apenas um resultado

  if (error) throw error;

  return data;
};

export { searchPipelineIsdefault };
``;
