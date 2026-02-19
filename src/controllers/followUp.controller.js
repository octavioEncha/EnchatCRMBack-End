import * as fupService from "../services/followUp.service.js";

export const createFUP = async (req, res) => {
  try {
    const data = req.body;
    await fupService.createFUP({ data });
    res.status(201).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listAllFollowUpByOfferId = async (req, res) => {
  try {
    const id = req.params.id;
    const allFollowUp = await fupService.listAllFollowUpByOfferId({ id });
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

export const deleteFollowUpById = async (req, res) => {
  try {
    const id = req.params.id;
    await fupService.deleteFollowUpById({ id });
    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
