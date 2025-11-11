import { supabase } from "../config/supabaseClient.js";
import * as leadsService from "./leads.service.js";
import * as conversationService from "./conversation.service.js";

export const especificMessaByConversationID = async ({ conversationId }) => {
  try {
    const searchAllMessages = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });
    return searchAllMessages.data;
  } catch (error) {
    //res.status(400).json({ error: error.message });
  }
};

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

    if (fromMe) {
      if (!phone || !messageContent) {
        console.warn("⚠️ Dados insuficientes:", { phone, messageContent });
        return null;
      }

      let lead = await leadsService.searchLead({ phone });
      if (!lead) {
        try {
          const response = await fetch(
            "http://localhost:8081/chat/fetchProfile/" + instance,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: "meu_token_secreto",
              },
              body: JSON.stringify({
                number: phone, // <-- correção
              }),
            }
          );
          const dataProfileUser = await response.json();

          data.data.pushName = dataProfileUser.name;
          data.avatar = dataProfileUser.picture;

          console.log(dataProfileUser);
        } catch (err) {
          console.warn("ERRO NA BUSCA DO LEAD: " + err.message);
        }

        lead = await leadsService.createNewLead({ data, phone });
        if (!lead) return console.warn("⚠️ Falha ao criar lead.");
      }
      let conversation = await conversationService.searchConversation({
        lead_id: lead.id,
      });

      if (!conversation) {
        conversation = await conversationService.createNewConversation({
          data: { user_id: lead.user_id, lead_id: lead.id },
        });
        if (!conversation) return console.warn("⚠️ Falha ao criar conversa.");
      }

      // FALTA PEGAR NOME DO LEAD
      console.log("MENSAGEM ENVIADA POR MIM PELO WHATSAPP");
      const { data: insertedMessageUser, error: errorUser } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversation.id,
            sender_type: "user",
            sender_id: lead.id,
            content: messageContent,
          },
        ])
        .select()
        .single();

      if (errorUser) throw new Error(error.message);

      console.log("✅ Mensagem criada:", insertedMessageUser);
      return insertedMessageUser;
    }

    if (!phone || !messageContent) {
      console.warn("⚠️ Dados insuficientes:", { phone, messageContent });
      return null;
    }

    let lead = await leadsService.searchLead({ phone });
    if (!lead) {
      const response = await fetch(
        "http://localhost:8081/chat/fetchProfile/" + instance,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "meu_token_secreto",
          },
          body: JSON.stringify({
            number: phone, // <-- correção
          }),
        }
      );
      const dataProfileUser = await response.json();

      data.data.pushName = dataProfileUser.name;
      data.avatar = dataProfileUser.picture;

      lead = await leadsService.createNewLead({ data, phone });
      if (!lead) return console.warn("⚠️ Falha ao criar lead.");
    }

    let conversation = await conversationService.searchConversation({
      lead_id: lead.id,
    });

    if (!conversation) {
      conversation = await conversationService.createNewConversation({
        data: { user_id: lead.user_id, lead_id: lead.id },
      });
      if (!conversation) return console.warn("⚠️ Falha ao criar conversa.");
    }

    const { data: insertedMessageLead, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversation.id,
          sender_type: "lead",
          sender_id: lead.id,
          content: messageContent,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    console.log("✅ Mensagem criada:", insertedMessageLead);
    return insertedMessageLead;
  } catch (err) {
    console.error("❌ Erro inesperado:", err.message);
    return null;
  }
};

export const createNewMessageSendCRM = async ({ data }) => {
  const phone = data?.key?.remoteJid.replace(/\D/g, "");

  const content = data?.message?.conversation;

  let lead = await leadsService.searchLead({ phone });
  if (!lead) {
    try {
    } catch (err) {
      console.warn("ERRO NA BUSCA DO LEAD: " + err.message);
    }

    return;
    lead = await leadsService.createNewLead({ data, phone });
    if (!lead) return console.warn("⚠️ Falha ao criar lead.");
  }

  let conversation = await conversationService.searchConversation({
    lead_id: lead.id,
  });

  if (!conversation) {
    conversation = await conversationService.createNewConversation({
      data: { user_id: lead.user_id, lead_id: lead.id },
    });
    if (!conversation) return console.warn("⚠️ Falha ao criar conversa.");
  }

  const { data: insertedMessageUser, error: errorUser } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversation.id,
        sender_type: "user",
        sender_id: lead.id,
        content: content,
      },
    ])
    .select()
    .single();

  if (errorUser) throw new Error(error.message);

  console.log("✅ Mensagem criada:", insertedMessageUser);
  return insertedMessageUser;

  console.log(data);
};
