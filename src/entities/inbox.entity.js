export default class Inbox {
  constructor({
    id,
    user_id,
    provider,
    api_key,
    webhook_url,
    is_active,
    number,
    offers,
    name,
    pipeline_id,
    pipeline,
    created_at,
    updated_at,
  }) {
    // IDs
    this.id = id || null;
    this.user_id = user_id || null;

    // Config
    this.provider = provider || null;
    this.api_key = api_key || null;
    this.webhook_url = webhook_url || null;

    // Status
    this.is_active = Boolean(is_active);

    // Info
    this.number = number || null;
    this.name = name || "Inbox Principal";
    this.pipeline_id = pipeline_id;

    this.offers = Array.isArray(offers)
      ? offers.map((offer) => ({
          id: offer.id,
          name: offer.name || null,
          product_name: offer.product_name || null,
          orderbump_product_name: offer.orderbump_product_name || null,
          upsell_product_name: offer.upsell_product_name || null,
          downsell_product_name: offer.downsell_product_name || null,
        }))
      : null;

    this.pipeline = pipeline
      ? {
          id: pipeline.id,
          name: pipeline.name || null,
          description: pipeline.description || null,
        }
      : null;

    // Datas
    this.createdAt = created_at || null;
    this.updatedAt = updated_at || null;

    this.validate();
  }

  validate() {
    if (!this.user_id) {
      throw new Error("Inbox must have user_id");
    }

    if (!this.provider) {
      throw new Error("Inbox must have provider");
    }

    if (!this.name) {
      throw new Error("Inbox must have name");
    }

    if (!this.pipeline_id) {
      throw new Error("Inbox must have pipeline_id");
    }

    const allowedProviders = ["whatsapp", "telegram", "instagram"];

    if (!allowedProviders.includes(this.provider)) {
      throw new Error(`Invalid provider: ${this.provider}`);
    }

    this.offers.forEach((offer) => {
      if (!offer.id) {
        throw new Error("Offer in inbox must have id");
      }
    });
  }

  isActive() {
    return this.is_active === true;
  }

  hasProduct() {
    return this.product !== null;
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      provider: this.provider,
      name: this.name,
      number: this.number,
      is_active: this.is_active,
      pipeline: this.pipeline,
      offers: this.offers,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
