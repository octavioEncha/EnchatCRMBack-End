import { supabase } from "../config/supabaseClient.js";
import * as leadsService from "./leads.service.js";
import * as conversationService from "./conversation.service.js";

/**
 * Retorna todas as mensagens de uma conversa específica
 */
export const especificMessaByConversationID = async ({ conversationId }) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error.message);
    return [];
  }
};

/**
 * Cria nova mensagem a partir do recebimento via WhatsApp
 * Pode ser enviada pelo usuário (fromMe = true) ou pelo lead (fromMe = false)
 */
export const createNewMessage = async ({ data }) => {
  try {
    const remoteJidRaw = data?.data?.key?.remoteJid;
    const phone = remoteJidRaw ? remoteJidRaw.replace(/\D/g, "") : null;
    const messageContent =
      data?.data?.message?.conversation ||
      data?.data?.message?.extendedTextMessage?.text ||
      "";
    const fromMe = data?.data?.key?.fromMe;
    const instance = data?.instance;

    if (!phone || !messageContent) {
      console.warn("⚠️ Dados insuficientes:", { phone, messageContent });
      return null;
    }

    // Busca ou cria o lead
    let lead = await leadsService.searchLead({ phone });
    if (!lead) {
      try {
        const response = await fetch(
          `http://localhost:8081/chat/fetchProfile/${instance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: "meu_token_secreto",
            },
            body: JSON.stringify({ number: phone }),
          }
        );
        const profile = await response.json();
        data.data.pushName = profile.name;
        data.avatar = profile.picture;
      } catch (err) {
        console.warn("Erro ao buscar perfil do lead:", err.message);
      }

      lead = await leadsService.createNewLead({ data, phone });
      if (!lead) {
        console.warn("⚠️ Falha ao criar lead.");
        return null;
      }
    }

    // Busca ou cria a conversa
    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: { user_id: lead.user_id, lead_id: lead.id },
      });
      if (!conversation) {
        console.warn("⚠️ Falha ao criar conversa.");
        return null;
      }
    }

    // Define tipo de remetente
    const senderType = fromMe ? "user" : "lead";

    // Cria a mensagem
    const { data: insertedMessage, error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversation.id,
          sender_type: senderType,
          sender_id: lead.id,
          content: messageContent,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Atualiza o timestamp da conversa
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        last_message_at: now,
      })
      .eq("id", conversation.id);

    if (updateError) {
      console.error("Erro ao atualizar last_message_at:", updateError);
    }

    console.log(
      `✅ Mensagem criada (${senderType}):`,
      insertedMessage?.content || "[sem conteúdo]"
    );

    return { lead, conversation, message: insertedMessage };
  } catch (err) {
    console.error("❌ Erro inesperado em createNewMessage:", err.message);
    return null;
  }
};

/**
 * Cria nova mensagem enviada manualmente pelo CRM (via interface)
 */
export const createNewMessageSendCRM = async ({ data }) => {
  try {
    const phone = data?.key?.remoteJid?.replace(/\D/g, "");
    const content = data?.message?.conversation;

    if (!phone || !content) {
      console.warn("⚠️ Dados insuficientes:", { phone, content });
      return null;
    }

    // Busca ou cria o lead
    let lead = await leadsService.searchLead({ phone });
    if (!lead) {
      lead = await leadsService.createNewLead({ data, phone });
      if (!lead) {
        console.warn("⚠️ Falha ao criar lead.");
        return null;
      }
    }

    // Busca ou cria a conversa
    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: { user_id: lead.user_id, lead_id: lead.id },
      });
      if (!conversation) {
        console.warn("⚠️ Falha ao criar conversa.");
        return null;
      }
    }

    // Insere a nova mensagem
    const { data: insertedMessage, error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversation.id,
          sender_type: "user",
          sender_id: lead.id,
          content,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Atualiza o timestamp da conversa
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        last_message_at: now,
      })
      .eq("id", conversation.id);

    if (updateError) {
      console.error("Erro ao atualizar last_message_at:", updateError);
    }

    console.log("✅ Mensagem criada via CRM:", insertedMessage.content);
    return { lead, conversation, message: insertedMessage };
  } catch (err) {
    console.error("❌ Erro em createNewMessageSendCRM:", err.message);
    return null;
  }
};
