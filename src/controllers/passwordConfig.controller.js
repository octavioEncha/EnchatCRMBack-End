import * as passwordConfigService from "../services/passwordConfig.service.js";

export const forgot_password = async (req, res) => {
  try {
    const data = req.body;
    const forgotPassword = await passwordConfigService.forgot_password({
      data,
    });
    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const token = req.params.token;
    const verify = await passwordConfigService.verifyToken({ token });
    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const token = req.params.token;
    const data = req.body;
    const update = passwordConfigService.updatePassword({ token, data });
    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
