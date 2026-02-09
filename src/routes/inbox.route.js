import { Router } from "express";
import * as inboxesController from "../controllers/inbox.controller.js";

const router = Router();

router.post("/create", inboxesController.createInbox);

router.get("/list/:id", inboxesController.getAllInboxes);

router.delete("/delete/:id", inboxesController.deleteInboxById);

export default router;
