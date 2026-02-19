import { findByIdOrThrow } from "./offers.service.js";
import { searchProdubyByIdOrThrow } from "./product.service.js";

import * as attamptsFUPService from "./attemptsFUP.service.js";

import * as fupModel from "../models/followUp.model.js";

import FollowUp from "../entities/fup.entity.js";

export const findByidOrThrow = async (id) => {
  const followUp = await fupModel.getFollowUpById({ id });

  if (!followUp) {
    throw new Error("Follow up not found!");
  }

  return new FollowUp(followUp);
};

export const createFUP = async ({ data }) => {
  await findByIdOrThrow(data.offer_id);

  const followUp = new FollowUp(data);

  const allSteps = await listAllFollowUpByOfferId({ id: followUp.offer_id });

  allSteps.filter((item) => {
    if (item.step === followUp.step) {
      throw new Error("A etapa deve ser única para cada follow up!");
    }
  });

  const newFollowUp = await fupModel.createFollowUp({ data: followUp });

  if (!followUp.steps || followUp.steps.length === 0) {
    throw new Error("Steps is required to create a follow up!");
  }

  followUp.steps.map(async (item) => {
    await attamptsFUPService.createAttempsFUP({
      fup_id: newFollowUp.id,
      data: item,
    });
  });
};

export const listAllFollowUpByOfferId = async ({ id }) => {
  const offer = await findByIdOrThrow(id);
  const product = await searchProdubyByIdOrThrow({ id: offer.product_id });
  const followUps = await fupModel.listAllFollowUpByOfferId({ id });

  const formatted = followUps.map((fup) => {
    return new FollowUp({
      ...fup,
    });
  });

  // adiciona o follow up de recompra como novo registro
  formatted.push(
    new FollowUp({
      id: "repurchase-" + product.id,
      user_id: offer.user_id,
      offer_id: offer.id,
      name: "FOLLOW UP DE RECOMPRA DO PRODUTO: " + product.name,
      step: "4°",
      steps: [
        {
          id: null,
          message: "FOLLOW UP DE RECOMPRA",
          rest: product.repurchase_time,
          rest_unit: "repurchase",
          created_at: null,
        },
      ],
      created_at: null,
      updated_at: null,
    }),
  );

  return formatted;
};

export const updateFollowUpById = async ({ id, data }) => {
  const followUP = await findByidOrThrow(id);
  const updateFollowUp = new FollowUp(data);

  const allSteps = await listAllFollowUpByOfferId({ id: followUP.offer_id });

  allSteps.filter((item) => {
    if (item.step === updateFollowUp.step && item.id !== id) {
      throw new Error("A etapa deve ser única para cada follow up!");
    }
  });

  const followUp = new FollowUp(data);

  await attamptsFUPService.deleteAttempsFUPByFollowUpId({ followUpId: id });

  await fupModel.updateFollowUpById({ id, data: followUp });

  followUp.steps.map(async (item) => {
    await attamptsFUPService.createAttempsFUP({
      fup_id: id,
      data: item,
    });
  });
};

export const deleteFollowUpById = async ({ id }) => {
  await findByidOrThrow(id);

  await attamptsFUPService.deleteAttempsFUPByFollowUpId({ followUpId: id });

  await fupModel.deleteFollowUpById({ id });
};
