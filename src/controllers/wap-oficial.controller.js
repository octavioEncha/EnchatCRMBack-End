import * as wap_oficial_service from "../services/wap-oficial.service.js";

export const getAllTemplatesByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const templates = await wap_oficial_service.getAllTemplatesByUserId({ id });
    res.status(200).json({ templates });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createNewTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    const response = await wap_oficial_service.createNewTemplate({
      data: templateData,
    });
    res.status(201).json({ message: "Template created success!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTemplateById = async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.query.name;
    await wap_oficial_service.deleteTemplateById(id, name);
    res.status(200).json({ message: "Template deleted success!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const setCredencial = async (req, res) => {
  try {
    const data = req.body;
    await wap_oficial_service.setCredencial({ data });
    res.status(201).json({ message: "Credentials saved successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getCredentialByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const credential = await wap_oficial_service.getCredentialByUserId({
      userId,
    });
    res.status(200).json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateCredentialById = async (req, res) => {
  try {
    const credentialId = req.params.id;
    const data = req.body;
    await wap_oficial_service.updateCredentialById({ credentialId, data });
    res.status(200).json({ message: "Credential updated successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCredentialById = async (req, res) => {
  try {
    const credentialId = req.params.id;

    await wap_oficial_service.deleteCredentialById({ id: credentialId });
    res.status(200).json({ message: "Credential deleted successfully!" });
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

    console.log("TO AQUI CARAI CONTROLLER");
    await wap_oficial_service.setVerification({ inboxId });

    return res.status(200).send(challenge);
  } catch (error) {
    console.error("Erro na verificação Meta:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

export const receiveMessages = async (req, res) => {
  try {
    const inboxId = req.params.id;
    const body = req.body;

    await wap_oficial_service.receiveMessages({
      inboxId,
      data: body,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json({ message: "Success!" });
};
