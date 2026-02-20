import Inbox from "../entities/inbox.entity.js";

import * as inboxModel from "../models/inbox.model.js";
import { findProfileById } from "./profile.service.js";

import { findByIdOrThrow } from "./offers.service.js";

import { seachPipelineById } from "./pipeline.service.js";

export const findInboxByIdOrThrow = async ({ id }) => {
  const inbox = await inboxModel.getInboxById({ id });

  if (!inbox) {
    throw new Error("Inbox not found!");
  }
  return inbox;
};

export const createNewInbox = async ({ user_id }) => {
  const existingInbox = await inboxModel.searchInbox({ instance: user_id });
  if (existingInbox) return true;

  const createInbox = await inboxModel.createNewInbox({ user_id });
  return createInbox;
};

export const createInbox = async ({ data }) => {
  await findProfileById({ id: data.user_id });

  await seachPipelineById({ id: data.pipeline_id });

  const pipelineIsSetAlready = await inboxWithPipelineSet({
    pipeline_id: data.pipeline_id,
  });

  if (pipelineIsSetAlready) {
    throw new Error("Pipeline já está associado a outro inbox");
  }

  await Promise.all(data.offers.map((offer) => findByIdOrThrow(offer.id)));

  const inbox = new Inbox({
    user_id: data.user_id,
    provider: "whatsapp",
    api_key: null,
    webhook_url: null,
    is_active: true,
    number: null,
    name: data.name,
    prompt: data.prompt,
    pipeline_id: data.pipeline_id,
    offers: data.offers,
  });

  const newInbox = await inboxModel.createInbox({ data: inbox });

  await Promise.all(
    data.offers.map((offer) =>
      inboxModel.createRelationOfferInbox({
        inbox_id: newInbox.id,
        offer_id: offer.id,
      }),
    ),
  );

  return true;
};

export const listAllInboxesByUserId = async ({ id }) => {
  await findProfileById({ id });

  const inboxes = await inboxModel.listAllInboxesByUserId({ id });

  return inboxes.map((inbox) => {
    const offers =
      inbox.offer_integration_channels?.map((rel) => ({
        id: rel.offer?.id,
        name: rel.offer?.name || null,
        product_name: rel.offer?.product?.name || null,
        orderbump_product_name: rel.offer?.orderbump?.name || null,
        upsell_product_name: rel.offer?.upsell?.name || null,
        downsell_product_name: rel.offer?.downsell?.name || null,
      })) || [];

    const { offer_integration_channels, ...rest } = inbox;

    return new Inbox({
      ...rest,
      offers,
      pipeline: inbox.pipeline ?? null, // 👈 precisa passar
    });
  });
};

export const inboxWithProductSet = async ({ product_id }) => {
  return await inboxModel.inboxWithProductSet({ product_id });
};

export const inboxWithPipelineSet = async ({ pipeline_id }) => {
  return await inboxModel.inboxWithPipelineSet({ pipeline_id });
};

export const updateInboxById = async ({ id, data }) => {
  await findInboxByIdOrThrow({ id });

  await inboxModel.updateInboxById({ id, data });

  await inboxModel.deleteRelationOfferInbox({ inbox_id: id });

  // 4️⃣ Recria relações (se vier offers)
  if (data.offers && data.offers.length > 0) {
    await Promise.all(
      data.offers.map((offer) =>
        inboxModel.createRelationOfferInbox({
          inbox_id: id,
          offer_id: offer.id,
        }),
      ),
    );
  }

  return true;
};

export const deleteInboxById = async ({ id }) => {
  await findInboxByIdOrThrow({ id });
  return await inboxModel.deleteInboxById({ id });
};
