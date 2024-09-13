const jwt = require("jsonwebtoken");
const { adminModel } = require("../models/admin");

exports.verification = (req, res, next) => {
  let token = req.headers["authtoken"];
  const tokenCheck = adminModel.find({
    tokens: { $elemMatch: { token: token } },
  });
  if(!tokenCheck){
    return res.status(401).send({
      success: false,
      error: true,
      message: "Invalid token.",
    })
  }
  if (token) {
    jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: true,
          message: "Failed to authenticate token.",
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      error: true,
      message: "No token provided.",
    });
  }
};
