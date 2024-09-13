const { adminModel } = require("../models/admin");

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const response = await adminModel.findByCredentials(email, password);
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  logout: async (req, res) => {
    const { email, token } = req.body;
    try {
      const response = await adminModel.adminLogout(email, token);
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  // register:async(req,res)=>{
  //   const {email,password}=req.body
  //   try {
  //     const response = new adminModel({email, password});
  //     await response.generateAuthToken();
  //     res.send()
  //     // res.status(response.status).send(response);
  //   } catch (error) {
  //     res
  //       .status(500)
  //       .send({ error: error.message, message: "Internal Server Error" });
  //   }
  // }
};
