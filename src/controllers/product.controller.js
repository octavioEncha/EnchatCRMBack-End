import * as productService from "../services/product.service.js";

export const createNewProduct = async (req, res) => {
  try {
    const data = req.body;

    await productService.createNewProduct({ data });
    res.status(201).json({
      message: "sucess",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listProductsByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await productService.listProductsByUserId({ id });

    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProductById = async (req, res) => {
  try {
    const data = req.body;
    const id = req.params.id;
    await productService.updateProductById({ id, data });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const id = req.params.id;
    await productService.deleteProductById({ id });
    res.status(200).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listProductsUnusedsPipelines = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await productService.listProductsUnusedsPipelines({ id });
    res.status(200).json({ products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listProductsUnusedsInboxes = async (req, res) => {
  try {
    const id = req.params.id;
    const products = await productService.listProductsUnusedsInboxes({ id });
    res.status(200).json({ products });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
