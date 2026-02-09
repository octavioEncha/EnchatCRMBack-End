import Inbox from "../entities/inbox.entity.js";

import * as inboxModel from "../models/inbox.model.js";
import { findProfileById } from "./profile.service.js";
import { searchProdubyByIdOrThrow } from "./product.service.js";

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
  await searchProdubyByIdOrThrow({ id: data.product_id });
  const inbox = new Inbox({
    id: null,
    user_id: data.user_id,
    provider: "whatsapp",
    api_key: null,
    webhook_url: null,
    is_active: true,
    number: null,
    product_id: data.product_id,
    name: data.name,
    products: null,
    created_at: null,
    updated_at: null,
  });

  return await inboxModel.createInbox({ data: inbox });
};

export const listAllInboxesByUserId = async ({ id }) => {
  await findProfileById({ id });

  const inboxes = await inboxModel.listAllInboxesByUserId({ id });

  console.log(inboxes);

  return inboxes.map((inbox) => new Inbox(inbox));
};

export const inboxWithProductSet = async ({ product_id }) => {
  return await inboxModel.inboxWithProductSet({ product_id });
};

export const deleteInboxById = async ({ id }) => {
  await findInboxByIdOrThrow({ id });
  return await inboxModel.deleteInboxById({ id });
};
