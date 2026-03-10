import { Router } from "express";
import * as wap_oficialController from "../controllers/wap-oficial.controller.js";

const router = Router();

//TEMPLATE -> Templates para envios de mensagens para os leads (+24 horas/disparo)
router.get("/template/:id", wap_oficialController.getAllTemplatesByUserId);

router.post("/template", wap_oficialController.createNewTemplate);

router.post(
  "/template/send",
  wap_oficialController.sendTemplateForClientNumber
);

router.delete("/template/:id", wap_oficialController.deleteTemplateById);

//CREDENCIAIS -> Facebook (token e waba_id)
router.get("/credencial/:id", wap_oficialController.getCredentialByUserId);

router.post("/credencial", wap_oficialController.setCredencial);

router.put("/credencial/:id", wap_oficialController.updateCredentialById);

router.delete("/credencial/:id", wap_oficialController.deleteCredentialById);

//WEBHOOK -> RECEBIMENTO DE MENSAGENS
router.get("/webhook/:id", wap_oficialController.verifyTokenByMeta);

router.post("/webhook/:id", wap_oficialController.receiveMessages);

export default router;
