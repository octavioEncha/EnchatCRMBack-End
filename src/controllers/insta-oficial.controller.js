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

export const verifyTokenByMeta = async (req, res) => {
  try {
    const inboxId = req.params.id;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    await insta_service.setVerification({ inboxId });

    return res.status(200).send(challenge);
  } catch (error) {
    console.error("Erro na verificação Meta:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};
