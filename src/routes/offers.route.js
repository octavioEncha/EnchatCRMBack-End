import { Router } from "express";
import * as offersController from "../controllers/offers.controller.js";

const router = Router();

router.post("/", offersController.createOffer);

router.get("/:id", offersController.getAllOffersByUserId);

router.put("/:id", offersController.updateOfferById);

router.delete("/:id", offersController.deleteOfferById);
export default router;
