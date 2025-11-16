import * as shootingService from "../services/shooting.service.js";

export const shootingToLead = async (req, res) => {
  try {
    const data = req.body;
    console.log("to aqui");
    const shootingLead = await shootingService.shootingToLead({ data });
    res.status(200).json({ response: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
