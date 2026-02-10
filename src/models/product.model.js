import { supabase } from "../config/supabaseClient.js";

export const createNewProduct = async ({ produto }) => {
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      user_id: produto.user_id,
      name: produto.name,
      description: produto.description,
      price: produto.price,
      stock_quantity: produto.stock,
      repurchase_time: produto.repurchasePeriod,
      payment_link: produto.paymentLinks,
      offer: produto.isOffer,
      orderBump: produto.isOrderBump,
      upSell: produto.isUpsell,
      downsell: produto.isDownsell,
    })
    .select()
    .single();

  if (error) throw error;

  const productId = product.id;

  return product;
};

export const createFaqForProduct = async ({ product_id, faq }) => {
  const faqData = faq.map((f) => ({
    product_id: product_id,
    question: f.question,
    response: f.answer,
  }));

  const { data, error } = await supabase.from("faq").insert(faqData);

  if (error) throw error;
};

export const listProductsByUserId = async ({ id }) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      faq (
        id,
        question,
        response
      )
    `,
    )
    .eq("user_id", id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const listProductById = async ({ id }) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      faq (
        id,
        question,
        response
      )
    `,
    )
    .eq("id", id)
    .single(); // 👈 retorna objeto, não array

  return data;
};

export const updateProductById = async ({ produto }) => {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: produto.name,
      description: produto.description,
      price: produto.price,
      stock_quantity: produto.stock,
      repurchase_time: produto.repurchasePeriod,
      payment_link: produto.paymentLinks,
      offer: produto.isOffer,
      orderBump: produto.isOrderBump,
      upSell: produto.isUpsell,
      downsell: produto.isDownsell,
    })
    .eq("id", produto.id)
    .select()
    .single();

  if (error) throw error;

  return;
};

export const updateFaqByProductId = async ({ product_id, faqs }) => {
  const { error: deleteError } = await supabase
    .from("faq")
    .delete()
    .eq("product_id", product_id);

  if (deleteError) throw deleteError;

  if (!faqs.length) return;

  const faqData = faqs.map((f) => ({
    product_id,
    question: f.question,
    response: f.answer,
  }));

  const { error: insertError } = await supabase.from("faq").insert(faqData);

  if (insertError) throw insertError;
};

export const deleteProductById = async ({ id }) => {
  const { error: deleteErrorProduct } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteErrorProduct) throw deleteErrorProduct;
};
