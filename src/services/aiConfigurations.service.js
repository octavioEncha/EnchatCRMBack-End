import { findProfileById } from "./profile.service.js";
import { findInboxByIdOrThrow } from "./inbox.service.js";
import * as aiConfigurationsModel from "../models/aiConfigurations.model.js";

export const getAIConfiguration = async ({ id_inbox }) => {
  const inbox = await findInboxByIdOrThrow({ id: id_inbox });

  const searchProfileByid = await findProfileById({ id: inbox.user_id });

  if (!searchProfileByid) {
    throw new Error("Profile not found");
  }

  const returnData = {
    webhook_url: searchProfileByid.webhook_url,
    is_active: searchProfileByid.ia_active,
  };

  return returnData;
};

export const updateConfigIA = async ({ id_inbox, data }) => {
  const inbox = await findInboxByIdOrThrow({ id: id_inbox });

  const searchProfileByid = await findProfileById({ id: inbox.user_id });

  return await aiConfigurationsModel.updateConfigIA({
    id_profile: searchProfileByid.id,
    data,
  });
};
