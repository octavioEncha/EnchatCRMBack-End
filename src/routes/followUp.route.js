import { Router } from "express";
import * as fupController from "../controllers/followUp.controller.js";

const router = Router();

router.post("/", fupController.createFUP);
router.get("/:id", fupController.listAllFollowUpByOfferId);
router.put("/:id", fupController.updateFollowUpById);
router.delete("/:id", fupController.deleteFollowUpById);

export default router;
