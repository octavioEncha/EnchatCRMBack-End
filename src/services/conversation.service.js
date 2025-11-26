import * as conversationModels from "../models/conversation.model.js";
import * as messageModels from "../models/message.model.js";
import { findProfileById } from "./profile.service.js";

export const listAllConversation = async ({ user_id }) => {
  try {
    // 1. Buscar conversas do usuário
    const conversations = await conversationModels.listAllConversation({
      user_id,
    });

    if (!conversations) {
      throw new Error("Nenhuma conversa encontrada para o usuário.");
    }

    // 2. Para cada conversa, buscar a última mensagem
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await messageModels.listLastMessage({
          conversation_id: conv.id,
        });

        return {
          ...conv,
          lastMessage,
        };
      })
    );

    return results;
  } catch (err) {
    throw new Error("Erro inesperado ao buscar conversa:", err.message);
  }
};

export const searchConversation = async ({ lead_id }) => {
  try {
    const searchConversation = await conversationModels.searchConversation({
      lead_id,
    });
    if (!searchConversation) {
      console.log("Nenhuma conversa encontrada para o lead_id:", lead_id);
      return null;
    }

    return searchConversation;
  } catch (err) {
    throw new Error("Erro inesperado ao buscar conversa:", err.message);
    return null;
  }
};

export const createNewConversation = async ({ data }) => {
  try {
    const aiConfigurationByProfile = await findProfileById({
      id: data.instance,
    });

    data.is_active = aiConfigurationByProfile.ia_active;

    const createNewConversation =
      await conversationModels.createNewConversation({
        data,
      });

    return createNewConversation;
  } catch (err) {
    console.error("Erro inesperado ao criar conversation:", err.message);
    return null;
  }
};

export const searchConversationId = async ({ id }) => {
  const searchConversation = await conversationModels.searchConversationId({
    id,
  });

  return searchConversation;
};
