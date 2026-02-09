export default class Inbox {
  constructor({
    id,
    user_id,
    provider,
    api_key,
    webhook_url,
    is_active,
    number,
    product_id,
    name,
    products,
    created_at,
    updated_at,
  }) {
    // IDs
    this.id = id || null;
    this.user_id = user_id || null;
    this.product_id = product_id || null;

    // Config
    this.provider = provider || null;
    this.api_key = api_key || null;
    this.webhook_url = webhook_url || null;

    // Status
    this.is_active = Boolean(is_active);

    // Info
    this.number = number || null;
    this.name = name || "Inbox Principal";

    // Produto (objeto simples, sem entity)
    this.product = products
      ? {
          id: products.id || null,
          name: products.name || null,
          price: products.price ?? null,
          description: products.description || null,
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

    const allowedProviders = ["whatsapp", "telegram", "instagram"];

    if (!allowedProviders.includes(this.provider)) {
      throw new Error(`Invalid provider: ${this.provider}`);
    }
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
      product: this.product,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
