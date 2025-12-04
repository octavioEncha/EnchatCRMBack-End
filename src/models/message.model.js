import { supabase } from "../config/supabaseClient.js";

export const listLastMessage = async ({ conversation_id }) => {
  const { data: lastMessage } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return lastMessage;
};

export const especificMessaByConversationID = async ({ conversationId }) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const specificMessaByLeadId = async ({ conversationId }) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  return data;
};

export const createMessage = async ({ data }) => {
  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: data.conversation_id,
        sender_type: data.senderType,
        sender_id: data.lead_id,
        content: data.messageContent,
      },
    ])
    .select()
    .single();

  return insertedMessage;
};

export const updateLastMessageTimestamp = async ({ conversationId }) => {
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("conversations")
    .update({
      last_message_at: now,
    })
    .eq("id", conversationId);

  return true;
};

export const createMessageForShootingToLead = async ({
  content,
  lead_id,
  conversation_id,
}) => {
  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversation_id,
        sender_type: "user",
        sender_id: lead_id,
        content,
      },
    ])
    .select()
    .single();

  return insertedMessage;
};

export const createNewMessageSendCRM = async ({
  content,
  lead_id,
  conversation_id,
}) => {
  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversation_id,
        sender_type: "user",
        sender_id: lead_id,
        content,
      },
    ])
    .select()
    .single();

  return insertedMessage;
};

export const createMessageWithAttachment = async ({ data }) => {
  console.log(data);

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: data.conversation_id,
        sender_type: data.senderType,
        sender_id: data.lead_id,
        content: data.attachmentUrl,
        attachment_type: data.messageType,
        has_attachment: true,
      },
    ])
    .select()
    .single();

  return insertedMessage;
};

export const processedMessageIds = new Set();

// Limpa cache a cada hora
setInterval(() => {
  if (processedMessageIds.size > 1000) {
    processedMessageIds.clear();
    console.log("🧹 Cache de mensagens limpo");
  }
}, 3600000);
