const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const admin = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

admin.method("removetoken", async function () {
  const admin = this;
  admin.tokens;
});

admin.method("generateAuthToken", async function () {
  const user = this;
  const signtoken = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWTSECRET,
    {
      expiresIn: "7d",
    }
  );
  user.tokens = user.tokens.concat({ token: signtoken });
  await user.save();
  return signtoken;
});

admin.static("adminLogout", async function (email, token) {
  const adminuser = await this.findOne({ email });
  if (!adminuser) {
    return {
      success: false,
      error: true,
      status: 404,
      message: "Admin Credentials are incorrect",
    };
  }
  
  await this.updateOne({ _id:adminuser._id }, { $pull: { tokens: { token: token } } });
  return {
    success: true,
    error: false,
    status: 200,
    message: "logout successfull",
  };
});

admin.static(
  "findByCredentials",
  async function (email, password, token = null) {
    const admin = await this.findOne({ email });
    if (!admin) {
      return {
        success: false,
        error: true,
        status: 404,
        message: "Admin Credentials are incorrect",
      };
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return {
        success: false,
        error: true,
        status: 404,
        message: "Admin Credentials are incorrect",
      };
    }
    return {
      success: true,
      error: false,
      status: 200,
      message: "login successfull",
      data: admin.email,
      token: await admin.generateAuthToken(),
    };
  }
);

admin.pre("save", async function (next) {
  const admin = this;
  if (admin.isModified("password")) {
    admin.password = await bcrypt.hash(admin.password, 8);
  }
  next();
});

exports.adminModel = mongoose.model("adminLogin", admin);
