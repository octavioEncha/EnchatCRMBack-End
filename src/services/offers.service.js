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

  if (offer.orderbump_product_ids?.length) {
    await Promise.all(
      offer.orderbump_product_ids.map((id) => {
        return searchProdubyByIdOrThrow({ id });
      }),
    );
  }

  if (offer.upsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.upsell_product_id });
  }

  if (offer.downsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.downsell_product_id });
  }

  const newOffer = await offersModel.createOffer({ data: offer });

  if (offer.orderbump_product_ids?.length) {
    await Promise.all(
      offer.orderbump_product_ids.map((id) => {
        return offersModel.createOfferOrderBumps({
          offer_id: newOffer.id,
          orderbump_product_id: id,
        });
      }),
    );
  }
};

export const getAllOffersByUserId = async (id) => {
  const offers = await offersModel.getAllOffersByUserId(id);

  return offers.map((offer) => new Offer(offer));
};

export const getAllOffersAndProductsByInboxId = async ({ inbox_id }) => {
  const allOffers = await offersModel.getAllOffersAndProductsByInboxId({
    inbox_id,
  });

  return allOffers;
};

export const updateOfferById = async ({ id, data }) => {
  await findByIdOrThrow(id);

  const offer = new Offer({ id, ...data });

  await searchProdubyByIdOrThrow({ id: offer.product_id });

  if (offer.orderbump_product_ids?.length) {
    await Promise.all(
      offer.orderbump_product_ids.map((id) => {
        return searchProdubyByIdOrThrow({ id });
      }),
    );
  }

  if (offer.upsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.upsell_product_id });
  }

  if (offer.downsell_product_id) {
    await searchProdubyByIdOrThrow({ id: offer.downsell_product_id });
  }

  await offersModel.updateOfferById({ id, data: offer });

  await offersModel.deleteOfferOderBumpByOfferId({ id });

  if (offer.orderbump_product_ids?.length) {
    await Promise.all(
      offer.orderbump_product_ids.map((id) => {
        return offersModel.createOfferOrderBumps({
          offer_id: offer.id,
          orderbump_product_id: id,
        });
      }),
    );
  }
};

export const deleteOfferById = async ({ id }) => {
  await findByIdOrThrow(id);

  await offersModel.deleteOfferOderBumpByOfferId({ id });

  return await offersModel.deleteOfferById({ id });
};
