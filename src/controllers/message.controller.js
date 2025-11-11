import * as messageService from "../services/messages.service.js";

export const specificMessaByConversationID = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    console.log("busca mensagens");
    const listMessage = await messageService.especificMessaByConversationID({
      conversationId,
    });
    res.status(200).json({ listMessage });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
