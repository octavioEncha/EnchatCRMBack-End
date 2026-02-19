import { Router } from "express";
import * as inboxesController from "../controllers/inbox.controller.js";

const router = Router();

router.post("/", inboxesController.createInbox);

router.get("/:id", inboxesController.getAllInboxes);

router.put("/:id", inboxesController.updateInboxById);

router.delete("/:id", inboxesController.deleteInboxById);

export default router;
