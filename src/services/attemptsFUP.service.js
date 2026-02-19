import * as attempsFUPModel from "../models/attemptsFUP.model.js";

export const createAttempsFUP = async ({ fup_id, data }) => {
  data.fup_id = fup_id;

  await attempsFUPModel.createAttempsFUP({ data });
};

export const deleteAttempsFUPByFollowUpId = async ({ followUpId }) => {
  await attempsFUPModel.deleteByFollowUpId({ id: followUpId });
};
