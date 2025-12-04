import { Router } from "express";
import * as leadController from "../controllers/lead.controller.js";

const router = Router();

router.get("/lead/:id", leadController.specificLeadId);

router.post("/lead/create", leadController.createNewLead);

export default router;
