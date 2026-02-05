import Product from "../entities/product.entity.js";
import { findProfileById } from "./profile.service.js";
import * as productModel from "../models/product.model.js";

const searchProdubyByIdOrThrow = async ({ id }) => {
  const produto = await productModel.listProductById({ id });

  if (!produto) {
    throw new Error("Not found Product");
  }

  return produto;
};

export const createNewProduct = async ({ data }) => {
  const faqs = JSON.parse(data.faqs || "[]");

  const produto = new Product({
    user_id: data.user_id,
    name: data.name,
    description: data.describe, // ✅ corrigido
    price: data.price,
    stock: data.stock,
    repurchasePeriod: data.repurchasePeriod,
    hasRAG: data.hasRAG,
    faqs,
    paymentLinks: data.paymentLinks,
    isOffer: data.isOffer,
    isOrderBump: data.isOrderBump,
    isUpsell: data.isUpsell,
    isDownsell: data.isDownsell,
  });

  const newProduct = await productModel.createNewProduct({ produto });

  if (produto.faqs?.length) {
    await productModel.createFaqForProduct({
      product_id: newProduct.id,
      faq: produto.faqs,
    });
  }

  return true; // ✅ importante
};

export const listProductsByUserId = async ({ id }) => {
  await findProfileById({ id });

  const products = await productModel.listProductsByUserId({ id });

  return products.map(
    (item) =>
      new Product({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,

        price: item.price,

        // 🔥 converte
        stock: item.stock_quantity,

        repurchasePeriod: item.repurchase_time,

        hasRAG: item.has_rag,

        faqs: item.faq,
        paymentLinks: item.payment_link,

        isOffer: item.offer,
        isOrderBump: item.orderBump,
        isUpsell: item.upSell,
        isDownsell: item.downsell,

        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })
  );
};

export const updateProductById = async ({ id, data }) => {
  const produto = await searchProdubyByIdOrThrow({ id });

  const faqs = JSON.parse(data.faqs || "[]");

  const updatedProduto = new Product({
    id: produto.id,
    user_id: produto.user_id,
    name: data.name,
    description: data.describe,
    price: data.price,
    stock: data.stock,
    repurchasePeriod: data.repurchasePeriod,
    hasRAG: data.hasRAG,
    faqs,
    paymentLinks: data.paymentLinks,
    isOffer: data.isOffer,
    isOrderBump: data.isOrderBump,
    isUpsell: data.isUpsell,
    isDownsell: data.isDownsell,
  });

  await productModel.updateProductById({ produto: updatedProduto });

  await productModel.updateFaqByProductId({
    product_id: updatedProduto.id,
    faqs: updatedProduto.faqs,
  });
};

export const deleteProductById = async ({ id }) => {
  const produto = await searchProdubyByIdOrThrow({ id });

  await productModel.deleteProductById({ id });
};
