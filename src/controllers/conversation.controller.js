import * as conversationService from "../services/conversation.service.js";

export const listAllConversation = async (req, res) => {
  try {
    const id = req.params.id;

    const listAllConversation = await conversationService.listAllConversation({
      user_id: id,
    });
    res.status(200).json({ listAllConversation });
  } catch (err) {
    console.error("Erro inesperado ao buscar conversa:", err.message);
    return null;
  }
};
