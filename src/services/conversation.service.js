import * as conversationModels from "../models/conversation.model.js";
import * as messageModels from "../models/message.model.js";
import { findProfileById } from "./profile.service.js";
import { findInboxByIdOrThrow } from "./inbox.service.js";

export const listAllConversation = async ({ inbox_id }) => {
  try {
    const conversations = await conversationModels.listAllConversation({
      inbox_id,
    });

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await messageModels.listLastMessage({
          conversation_id: conv.id,
        });

        return {
          ...conv,
          lastMessage,
        };
      }),
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
    const inbox = await findInboxByIdOrThrow({
      id: data.inbox_id,
    });

    const user_id = inbox?.user_id;

    const aiConfigurationByProfile = await findProfileById({
      id: user_id,
    });

    data.is_active = aiConfigurationByProfile.ia_active;
    data.inbox_id = inbox.id;
    data.user_id = user_id;

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
