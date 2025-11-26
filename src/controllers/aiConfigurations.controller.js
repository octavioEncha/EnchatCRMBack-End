import * as iaConfigurationService from "../services/aiConfigurations.service.js";

export const getAIConfiguration = async (req, res) => {
  try {
    const id_profile = req.params.id_profile;
    const getConfiguration = await iaConfigurationService.getAIConfiguration({
      id_profile,
    });
    res.status(200).json({ ai_configuration: getConfiguration });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateConfigIA = async (req, res) => {
  try {
    const id_profile = req.params.id_profile;
    const data = req.body;

    const updateConfigIA = await iaConfigurationService.updateConfigIA({
      id_profile,
      data,
    });

    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
