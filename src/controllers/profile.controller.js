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

export const signUpProfile = async (req, res) => {
  try {
    const data = req.body;
    const signUp = await profileService.signUpProfile({ data });
    res.status(201).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
