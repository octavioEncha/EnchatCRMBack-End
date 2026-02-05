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

export const createPaymentLinkForProduct = async ({ product_id, links }) => {
  const linksData = links.map((link) => ({
    product_id,
    link,
  }));

  await supabase.from("payment_link").insert(linksData);
};
