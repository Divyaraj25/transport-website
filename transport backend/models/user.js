const mongoose = require("mongoose");
const validator = require("validator");
const {
  addIdentityCounterPlugin,
} = require("../plugins/identity_counter.plugin");
const { createUidModel } = require("./identityCounter");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const userSchema = new mongoose.Schema({
  uid: {
    type: Number,
  },
  custId: {
    type: String,
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
});

userSchema.post("validate", (error, doc, next) => {
  next(new Error(error.message));
});

userSchema.post("findOneAndUpdate", (error, doc, next) => {
  if (error.code === 11000) {
    if (error.keyPattern.email) {
      return next(new Error("Email already exists"));
    } else if (error.keyPattern.phone_no) {
      return next(new Error("phone number already exists"));
    }
  }
  next(error);
});

userSchema.pre("save", async function (next) {
  const user = this;
  try {
    const uniqueId = await createUidModel.findOneAndUpdate(
      { model: "user" },
      { $inc: { counter: 1 } },
      { new: true, upsert: true }
    );
    user.uid = uniqueId.counter;
  } catch (error) {
    console.log(error);
    next(new Error("Something went wrong while creating unique id"));
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      phone: user.prefix + user.phone_no,
    });
    user.custId = customer.id;
    next();
  } catch (error) {
    console.log(error);
    next(new Error("Something went wrong with stripe api"));
  }
});

userSchema.plugin(addIdentityCounterPlugin, {
  model: "user",
  field: "uid",
  startAt: 1000,
});

exports.userModel = mongoose.model("user", userSchema);
