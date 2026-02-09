import * as conversationService from "../services/conversation.service.js";

export const listAllConversation = async (req, res) => {
  try {
    const id = req.params.id;

    const listAllConversation = await conversationService.listAllConversation({
      inbox_id: id,
    });

    console.log(listAllConversation);
    res.status(200).json({ listAllConversation });
  } catch (err) {
    console.error("Erro inesperado ao buscar conversa:", err.message);
    return null;
  }
};
