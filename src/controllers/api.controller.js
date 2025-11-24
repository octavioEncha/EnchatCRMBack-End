import * as apiService from "../services/api.service.js";

export const sendMessage = async (req, res) => {
  try {
    const data = req.body;
    const sendMessage = await apiService.sendMessage({ data });
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
