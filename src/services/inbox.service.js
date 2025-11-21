import * as inboxModel from "../models/inbox.model.js";

export const createNewInbox = async ({ user_id }) => {
  const existingInbox = await inboxModel.searchInbox({ instance: user_id });
  if (existingInbox) return true;

  const createInbox = await inboxModel.createNewInbox({ user_id });
  return createInbox;
};
