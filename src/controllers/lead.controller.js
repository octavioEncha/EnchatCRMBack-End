import * as leadService from "../services/leads.service.js";
export const specificLeadId = async (req, res) => {
  try {
    const id = req.params.id;
    const getLead = await leadService.searchLeadId({ id });
    res.status(200).json({ getLead });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createNewLead = async (req, res) => {
  try {
    const data = req.body;
    const createNewLead = await leadService.createNewLead({ data });
    res.status(201).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
