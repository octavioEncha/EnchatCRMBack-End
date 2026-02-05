import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = Router();

router.post(
  "/create",
  upload.single("file"),
  productController.createNewProduct
);

export default router;
