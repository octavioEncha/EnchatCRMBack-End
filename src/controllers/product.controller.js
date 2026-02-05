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
