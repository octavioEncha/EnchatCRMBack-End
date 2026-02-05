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

router.get("/list/:id", productController.listProductsByUserId);

router.put(
  "/update/:id",
  upload.single("file"),
  productController.updateProductById
);

router.delete("/delete/:id", productController.deleteProductById);

export default router;
