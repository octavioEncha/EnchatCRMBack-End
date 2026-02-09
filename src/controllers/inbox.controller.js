import * as inboxService from "../services/inbox.service.js";

export const createInbox = async (req, res) => {
  try {
    const data = req.body;
    await inboxService.createInbox({ data });
    res.status(201).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllInboxes = async (req, res) => {
  try {
    const id = req.params.id;
    const inboxes = await inboxService.listAllInboxesByUserId({ id });
    res.status(200).json({ inboxes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteInboxById = async (req, res) => {
  try {
    const id = req.params.id;
    await inboxService.deleteInboxById({ id });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
