import { searchProdubyByIdOrThrow } from "./product.service.js";
import { getPipelinesWithProductsSet } from "./pipeline.service.js";

import * as fupModel from "../models/followUp.model.js";

import FollowUp from "../entities/fup.entity.js";

export const listFollowUpByIdOrThrow = async ({ id }) => {
  const fup = await fupModel.listFollowUpById({ id });

  if (!fup) {
    throw new Error("Follow up not found by id!");
  }

  return fup;
};

export const listAllFollowUpByProductId = async ({ id }) => {
  const product = await searchProdubyByIdOrThrow({ id });
  const pipeline = await getPipelinesWithProductsSet({ id: product.id });

  const fup = await fupModel.listAllFollowUpByProductId({ id: product.id });

  return fup.map(
    (item) =>
      new FollowUp({
        ...item,
        product,
        pipeline,
      }),
  );
};

export const updateFollowUpById = async ({ id, data }) => {
  const fup = await listFollowUpByIdOrThrow({ id });

  const followUp = new FollowUp(fup);

  followUp.message_template = data.message_template;
  followUp.delay_hours = data.delay_hours;

  await fupModel.updateFollowUpById({ data: followUp });
};
