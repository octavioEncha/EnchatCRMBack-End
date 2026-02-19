export default class FollowUp {
  constructor({
    id,
    user_id,
    offer_id,
    name,
    step,
    steps,
    created_at,
    updated_at,
  }) {
    // IDs
    this.id = id || null;
    this.user_id = user_id;
    this.offer_id = offer_id;

    //Dados gerais
    this.name = name;
    this.step = step;
    this.steps =
      steps && Array.isArray(steps)
        ? steps.map((step) => ({
            id: step.id || null,
            message: step.message,
            rest: step.rest,
            rest_unit: step.rest_unit,
            created_at: step.created_at || null,
          }))
        : null;
    // Datas
    this.createdAt = created_at || null;
    this.updatedAt = updated_at || null;

    this.validate();
  }

  validate() {
    const stepValid = ["1°", "2°", "3°", "4°"];
    const restUnitValid = ["minutes", "hours", "days", "repurchase"];

    if (!this.user_id) {
      throw new Error("Follow up must have user_id");
    }

    if (!this.offer_id) {
      throw new Error("Follow up must have offer_id");
    }

    if (!this.name) {
      throw new Error("Follow up must have name");
    }

    if (!this.step || !stepValid.includes(this.step)) {
      throw new Error("Follow up must have a valid step");
    }

    if (this.steps) {
      if (!this.steps) {
        throw new Error("Follow up must have steps");
      }
      this.steps.forEach((step) => {
        if (!step.message) {
          throw new Error("Each step must have a message");
        }
        if (!restUnitValid.includes(step.rest_unit)) {
          throw new Error("Each step must have a valid rest unit");
        }
      });
    }
  }
}
