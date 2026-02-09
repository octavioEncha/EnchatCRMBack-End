import * as iaConfigurationService from "../services/aiConfigurations.service.js";

export const getAIConfiguration = async (req, res) => {
  try {
    const id = req.params.id;
    const getConfiguration = await iaConfigurationService.getAIConfiguration({
      id_inbox: id,
    });
    res.status(200).json({ ai_configuration: getConfiguration });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateConfigIA = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const updateConfigIA = await iaConfigurationService.updateConfigIA({
      id_inbox: id,
      data,
    });

    res.status(200).json({ message: "sucess" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
