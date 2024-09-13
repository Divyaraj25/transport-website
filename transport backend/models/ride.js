const mongoose = require("mongoose");
const validator = require("validator");

const rideSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      return (
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).toUpperCase().slice(2)
      ).slice(0, 20);
    },
  },
  userUID: {
    type: Number,
    required: true,
  },
  profile: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validate(value) {
      if (validator.isEmail(value)) {
        return true;
      } else {
        throw new Error("Email is not valid");
      }
    },
  },
  phone_no: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isNumeric(value)) {
        throw new Error("Phone number should be contain digits only");
      } else if (value.length !== 10) {
        throw new Error("Phone number should be of 10 digits");
      }
    },
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
    enum: ["cash", "card"],
  },
  custId: {
    type: String,
  },
  cardId: {
    type: String,
  },
  vehicle_type: {
    type: String,
    required: true,
  },
  vehicle_image: {
    type: String,
  },
  base_prize: {
    type: Number,
  },
  prize_per_distance: {
    type: Number,
  },
  prize_per_time: {
    type: Number,
  },
  min_fare: {
    type: Number,
  },
  total_fare: {
    type: Number,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  distance: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "available",
      "pending",
      "accepted",
      "arrived",
      "picked",
      "started",
      "completed",
      "cancelled",
    ],
    default: "available",
  },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  stops: {
    type: [String],
  },
  stopNumber: {
    type: Number,
  },
  sourceLatLng: {
    type: [Number],
    required: true,
  },
  destinationLatLng: {
    type: [Number],
    required: true,
  },
  stopsLatLng: {
    type: [[Number]],
  },
  dateTime: {
    type: Date,
    default: Date.now(),
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId || null || String,
    default: null,
    ref: "driver",
  },
  rejected: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "driver",
  },
  assignedAt: {
    type: Date || null,
  },
  assignAny: {
    type: Boolean,
    default: false,
  },
  rating:{
    type:Number,
    default:0
  },
  paymentIntentId:{
    type:String,
  }
});

rideSchema.post("validate", (error, doc, next) => {
  next(new Error(error.message));
});

rideSchema.post("save", (error, doc, next) => {
  console.log(error);
  next(new Error(error.message));
});

exports.ridesModel = mongoose.model("ride", rideSchema);
