const mongoose = require("mongoose");
const validator = require("validator");
const { createUidModel } = require("./identityCounter");
const {
  addIdentityCounterPlugin,
} = require("../plugins/identity_counter.plugin");

const driverSchema = new mongoose.Schema({
  uid: {
    type: Number,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (validator.isEmail(value)) {
        return true;
      } else {
        throw new Error("Email is not valid");
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
  prefix: {
    type: String,
    required: true,
  },
  phone_no: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isNumeric(value)) {
        throw new Error("Phone number should be contain digits only");
      } else if (value.length !== 10) {
        throw new Error("Phone number should be of 10 digits");
      }
    },
  },
  profile: {
    type: String,
    required: true,
  },
  vehicle_type: {
    type: String,
    default: null,
  },
  vehicle_image: {
    type: String,
    default: null,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  ridesId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "ride",
  },
  running: {
    type: Boolean,
    default: false,
  },
});

driverSchema.post("validate", (error, doc, next) => {
  next(new Error(error.message));
});

driverSchema.post("findOneAndUpdate", (error, doc, next) => {
  if (error.code === 11000) {
    if (error.keyPattern.email) {
      return next(new Error("Email already exists"));
    } else if (error.keyPattern.phone_no) {
      return next(new Error("phone number already exists"));
    }
  }
  next(error);
});

driverSchema.pre("save", async function (next) {
  const driver = this;
  try {
    const uniqueId = await createUidModel.findOneAndUpdate(
      { model: "driver" },
      { $inc: { counter: 1 } },
      { new: true, upsert: true }
    );
    driver.uid = uniqueId.counter;
  } catch (error) {
    console.log(error);
    next(new Error("Something went wrong while creating unique id"));
  }
});

driverSchema.plugin(addIdentityCounterPlugin, {
  model: "driver",
  field: "uid",
  startAt: 1000,
});

exports.driverModel = mongoose.model("driver", driverSchema);
