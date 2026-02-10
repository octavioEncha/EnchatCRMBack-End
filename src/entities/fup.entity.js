export default class Inbox {
  constructor({
    id,
    product_id,
    pipeline_id,
    user_id,
    fup_type,
    message_template,
    delay_hours,
    pipeline,
    product,
    created_at,
    updated_at,
  }) {
    // IDs
    this.id = id || null;
    this.product_id = product_id || null;
    this.pipeline_id = pipeline_id || null;
    this.user_id = user_id || null;

    // Follow-up
    this.fup_type = fup_type || null;
    this.message_template = message_template || null;
    this.delay_hours = delay_hours ?? null;

    // Produto (objeto simples)
    this.product = product
      ? {
          id: product.id || null,
          name: product.name || null,
          price: product.price ?? null,
          description: product.description || null,
          repurchase_time: product.repurchase_time || null,
        }
      : null;

    // Pipeline (objeto simples)
    this.pipeline = pipeline
      ? {
          id: pipeline.id || null,
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

    if (!this.product_id) {
      throw new Error("Inbox must have product_id");
    }

    if (!this.pipeline_id) {
      throw new Error("Inbox must have pipeline_id");
    }
  }
}
