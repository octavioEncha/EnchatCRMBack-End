import * as profileService from "../services/profile.service.js";
export const generateTokenToUser = async (req, res) => {
  try {
    const data = req.body;
    const token = await profileService.createToken({ data });
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
