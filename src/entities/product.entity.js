export default class Product {
  constructor({
    id,

    user_id,

    name,
    description,

    price,
    stock,

    repurchasePeriod,

    hasRAG,

    faqs,
    paymentLinks,

    createdAt,
    updatedAt,
  }) {
    this.id = id || null;

    this.user_id = user_id;

    this.name = name;
    this.description = description;

    this.price = Number(price);
    this.stock = Number(stock);

    this.repurchasePeriod = repurchasePeriod;

    this.hasRAG = Boolean(hasRAG);

    this.faqs = faqs || [];
    this.paymentLinks = paymentLinks || [];

    this.createdAt = createdAt || null;
    this.updatedAt = updatedAt || null;

    this.validate();
  }

  validate = () => {
    const fields = {
      user_id: this.user_id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      repurchasePeriod: this.repurchasePeriod,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "number" && isNaN(value))
      ) {
        throw new Error(`Missing or invalid field in Product: ${key}`);
      }
    }

    if (this.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (this.stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    if (!Array.isArray(this.faqs)) {
      throw new Error("FAQs must be an array");
    }

    if (!Array.isArray(this.paymentLinks)) {
      throw new Error("paymentLinks must be an array");
    }
  };
}
