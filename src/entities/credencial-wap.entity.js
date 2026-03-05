export default class Credential {
  constructor({ id, user_id, waba_id, token, created_at, updated_at }) {
    this.id = id || null;
    this.user_id = user_id;
    this.waba_id = waba_id;
    this.token = token;
    this.createdAt = created_at || null;
    this.updatedAt = updated_at || null;

    this.validate();
  }

  validate() {
    if (!this.user_id) {
      throw new Error("Credential up must have user id");
    }

    if (!this.waba_id) {
      throw new Error("Credential up must have waba id");
    }

    if (!this.token) {
      throw new Error("Credential up must have token");
    }
  }
}
