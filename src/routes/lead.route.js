import { Router } from "express";
import * as leadController from "../controllers/lead.controller.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = Router();

router.get("/lead/:id", leadController.specificLeadId);

router.post("/lead/create", leadController.createNewLead);

router.get("/lead/preview-import/:id", leadController.previewImportLeads);

router.post("/lead/import", upload.single("file"), leadController.importLeads);

export default router;
