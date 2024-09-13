const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Polygon"],
    required: true,
  },
  coordinates: {
    type: [[[Number]]],
    required: true,
  },
});

const citySchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    unique: true,
  },
  zone: {
    type: zoneSchema,
    index: "2dsphere",
  },
  cca2: {
    type: String,
    required: true,
  },
});

citySchema.index({ cca2: 1 });

citySchema.post("save", (error, doc, next) => {
  if (error.code === 11000) {
    next(new mongoose.Error("City already registered"));
  }
  next(error);
});

exports.cityModel = mongoose.model("city", citySchema);
