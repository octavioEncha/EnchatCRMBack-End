import { Router } from "express";
import * as wap_oficial from "../controllers/wap-oficial.controller.js";

const router = Router();

//router.post("/shooting", shootingController.shootingToLead);

router.get("/template/:id", wap_oficial.getAllTemplatesByWapId);

router.post("/template", wap_oficial.createNewTemplate);

router.delete("/template/:id", wap_oficial.deleteTemplateById);

//DELETE /template/1407680676729941?name=order_confirmation
export default router;
