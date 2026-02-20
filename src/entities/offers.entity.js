export default class Offer {
  constructor({
    id,
    user_id,
    product_id,
    orderbump_product_ids,
    upsell_product_id,
    downsell_product_id,
    name,
    created_at,
    updated_at,
  }) {
    this.id = id || null;
    this.product_id = product_id || null;
    this.user_id = user_id || null;

    this.orderbump_product_ids = Array.isArray(orderbump_product_ids)
      ? orderbump_product_ids
      : null;

    this.upsell_product_id = upsell_product_id || null;
    this.downsell_product_id = downsell_product_id || null;

    this.name = name || null;

    this.createdAt = created_at || null;
    this.updatedAt = updated_at || null;

    this.validate();
  }

  validate() {
    if (!this.user_id) {
      throw new Error("Offer must have user_id");
    }

    if (!this.product_id) {
      throw new Error("Offer must have product_id");
    }

    if (!this.name) {
      throw new Error("Offer must have name");
    }
  }
}
