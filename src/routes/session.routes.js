import { Router } from "express";
import {
  listSessions,
  getContacts,
  getMessages,
  clearCache,
  cacheSize,
} from "../controllers/session.controller.js";

const router = Router();

router.get("/sessions", listSessions);
router.get("/sessions/:id/contacts", getContacts);
router.get("/sessions/:id/messages/:number", getMessages);
router.post("/clear-cache", clearCache);
router.get("/cache-size", cacheSize);

export default router;
