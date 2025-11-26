import { findProfileById } from "./profile.service.js";
import * as aiConfigurationsModel from "../models/aiConfigurations.model.js";

export const getAIConfiguration = async ({ id_profile }) => {
  const searchProfileByid = await findProfileById({ id: id_profile });

  if (!searchProfileByid) {
    throw new Error("Profile not found");
  }

  const returnData = {
    webhook_url: searchProfileByid.webhook_url,
    is_active: searchProfileByid.ia_active,
  };

  return returnData;
};

export const updateConfigIA = async ({ id_profile, data }) => {
  const searchProfileByid = await findProfileById({ id: id_profile });

  return await aiConfigurationsModel.updateConfigIA({ id_profile, data });
};
