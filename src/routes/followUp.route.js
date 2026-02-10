import { Router } from "express";
import * as fupController from "../controllers/followUp.controller.js";

const router = Router();

router.get("/list/:id", fupController.listAllFollowUpByProductId);
router.put("/update/:id", fupController.updateFollowUpById);

export default router;
