import { supabase } from "../config/supabaseClient.js";

export const verifyScheduledMessages = async () => {
  const { data, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending");

  if (error) {
    console.error("Erro ao buscar mensagens agendadas:", error);
    return [];
  }

  return data;
};

export const updateStatusScheduleMessages = async ({ id }) => {
  const { data, error } = await supabase
    .from("scheduled_messages")
    .update({ status: "sent" })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar status:", error);
    return null;
  }

  return data;
};
