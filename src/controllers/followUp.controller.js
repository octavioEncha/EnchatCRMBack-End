import * as fupService from "../services/followUp.service.js";

export const listAllFollowUpByProductId = async (req, res) => {
  try {
    const id = req.params.id;
    const allFollowUp = await fupService.listAllFollowUpByProductId({ id });
    res.status(200).json(allFollowUp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateFollowUpById = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    await fupService.updateFollowUpById({ id, data });
    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
