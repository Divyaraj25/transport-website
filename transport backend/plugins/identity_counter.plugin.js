exports.addIdentityCounterPlugin = async (schema, options) => {
  schema.statics.addIdentityCounter = async function (options) {
    const { model, field, startAt } = options;
    let counterValue = startAt || 1;
    const newIdentityCounter = new createUidModel({
      model,
      field,
      counter: counterValue,
    });
    try {
      await newIdentityCounter.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "identity counter for model added successfully",
      };
    } catch (e) {
      return {
        success: false,
        error: true,
        status: 400,
        message: e.message,
      };
    }
  };

  schema.plugin(function (schema) {
    schema.pre("save", async function () {
      if (!this.isModified(options.field)) {
        await this.constructor.addIdentityCounter(options);
      }
    });
  });
};
