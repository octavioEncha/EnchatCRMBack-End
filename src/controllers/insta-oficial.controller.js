import * as insta_service from "../services/insta-oficial.service.js";

export const receiveMessageByWebhook = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    await insta_service.receiveMessageByWebhook({ inbox_id: id, data: body });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
