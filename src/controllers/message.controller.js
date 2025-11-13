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

export const specificMessaByLeadId = async (req, res) => {
  try {
    const lead_id = req.params.lead_id;

    const listMessage = await messageService.specificMessaByLeadId({
      lead_id,
    });
    res.status(200).json({ listMessage });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
