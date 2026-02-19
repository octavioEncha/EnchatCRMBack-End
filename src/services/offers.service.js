import { searchProdubyByIdOrThrow } from "./product.service.js";

import * as offersModel from "../models/offers.model.js";

import Offer from "../entities/offers.entity.js";

export const findByIdOrThrow = async (id) => {
  const offer = await offersModel.findById(id);

  if (!offer) {
    throw new Error("Offer not found");
  }

  return new Offer(offer);
};

export const createNewOffer = async ({ data }) => {
  const offer = new Offer(data);

  await searchProdubyByIdOrThrow({ id: offer.product_id });

  if (offer.orderbump_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.orderbump_product_id });
  }

  if (offer.upsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.upsell_product_id });
  }

  if (offer.downsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.downsell_product_id });
  }

  return await offersModel.createOffer({ data: offer });
};

export const getAllOffersByUserId = async (id) => {
  const offers = await offersModel.getAllOffersByUserId(id);

  return offers.map((offer) => new Offer(offer));
};

export const updateOfferById = async ({ id, data }) => {
  await findByIdOrThrow(id);

  const offer = new Offer({ id, ...data });

  await searchProdubyByIdOrThrow({ id: offer.product_id });

  if (offer.orderbump_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.orderbump_product_id });
  }

  if (offer.upsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.upsell_product_id });
  }

  if (offer.downsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.downsell_product_id });
  }

  return await offersModel.updateOfferById({ id, data: offer });
};

export const deleteOfferById = async ({ id }) => {
  await findByIdOrThrow(id);

  return await offersModel.deleteOfferById({ id });
};
