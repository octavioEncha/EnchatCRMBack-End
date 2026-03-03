import * as wap_oficial_service from "../services/wap-oficial.service.js";

export const getAllTemplatesByWapId = async (req, res) => {
  try {
    const id = req.params.id;
    const templates = await wap_oficial_service.getAllTemplatesByWapId({ id });
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
