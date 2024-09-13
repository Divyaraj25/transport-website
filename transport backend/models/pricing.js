const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema({
  vehicle_type: {
    type: String,
    required: true,
  },
  vehicle_image: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  driver_profit: {
    type: Number,
    required: true,
  },
  min_fare: {
    type: Number,
    required: true,
  },
  distance_base_prize: {
    type: Number,
    required: true,
  },
  base_prize: {
    type: Number,
    required: true,
  },
  prize_per_distance: {
    type: Number,
    required: true,
  },
  prize_per_time: {
    type: Number,
    required: true,
  },
  max_space: {
    type: Number,
    required: true,
  },
});

pricingSchema.index({ city: 1 });

pricingSchema.post("save", (error, doc, next) => {
  next(new mongoose.Error(error.message));
});

exports.pricingModel = mongoose.model("pricing", pricingSchema);
