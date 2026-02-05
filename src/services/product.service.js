import Product from "../entities/product.entity.js";

import * as productModel from "../models/product.model.js";

export const createNewProduct = async ({ data }) => {
  const faqs = JSON.parse(data.faqs || "[]");
  const paymentLinks = JSON.parse(data.paymentLinks || "[]");

  const produto = new Product({
    user_id: data.user_id,
    name: data.name,
    description: data.describe,
    price: data.price,
    stock: data.stock,
    repurchasePeriod: data.repurchasePeriod,
    hasRAG: data.hasRAG,
    faqs,
    paymentLinks,
  });

  const newProduct = await productModel.createNewProduct({ produto });

  if (produto.faqs?.length) {
    await productModel.createFaqForProduct({
      product_id: newProduct.id,
      faq: produto.faqs,
    });

    if (produto.paymentLinks.length) {
      await productModel.createPaymentLinkForProduct({
        product_id: newProduct.id,
        links: produto.paymentLinks,
      });
    }
  }
};
