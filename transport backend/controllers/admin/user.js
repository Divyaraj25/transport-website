const fs = require("node:fs");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  addUserData,
  editUserData,
  checkUserEmailAndPhone,
} = require("../../database functions/CRUD_database");
const { userModel } = require("../../models/user");

module.exports = {
  addCard: async (req, res) => {
    const { token, custId } = req.body;
    try {
      await stripe.customers.createSource(custId, {
        source: token,
      });
      res.status(201).send({
        success: true,
        error: false,
        message: "Card added successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Something went wrong with stripe api while adding card",
      });
    }
  },
  deleteCard: async (req, res) => {
    const { custId, cardId } = req.query;
    try {
      await stripe.customers.deleteSource(custId, cardId);
      res.status(200).send({
        success: true,
        error: false,
        message: "Card deleted successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Something went wrong with stripe api while deleting card",
      });
    }
  },
  setDefaultCard: async (req, res) => {
    let { cardId, custId } = req.body;
    try {
      await stripe.customers.update(custId, { default_source: cardId });
      res.status(200).send({
        success: true,
        error: false,
        message: "Card set as default successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message:
          "Something went wrong with stripe api while setting default card",
      });
    }
  },

  addUser: async (req, res) => {
    const { email, phone_no } = req.body;

    const response = await checkUserEmailAndPhone(userModel, email, phone_no);
    if (response.status === 200) {
      try {
        const response = await addUserData(req.body, req.file);
        res.status(response.status).send(response);
      } catch (error) {
        res
          .status(500)
          .send({ error: error.message, message: "Internal server error" });
      }
    } else {
      res.status(response.status).send(response);
    }
  },
  getUsers: async (req, res) => {
    let { page, sortV, limitV } = req.query;

    if (sortV.search(" ") !== -1) {
      sortV = sortV.replace(" ", "_");
    }

    let limit = parseInt(limitV) || 5;
    let pageValue = parseInt(page) || 1;
    let skip = (pageValue - 1) * limit;
    let count = await userModel.countDocuments();
    let totalpages = Math.ceil(count / limit);

    const pipeline = [];

    if (sortV.toLowerCase() !== "none") {
      if (sortV.toLowerCase() === "email") {
        pipeline.push({
          $addFields: {
            emailSort: { $toLower: "$email" },
          },
        });
        pipeline.push({
          $sort: { emailSort: 1 },
        });
      } else {
        pipeline.push({
          $sort: { [sortV]: 1 },
        });
      }
    }

    pipeline.push({
      $skip: skip,
    });
    pipeline.push({
      $limit: limit,
    });

    try {
      const users = await userModel.aggregate(pipeline);
      res.status(200).send({
        success: true,
        error: false,
        data: { users, count, limit, pageValue },
        message: "users fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  searchUsers: async (req, res) => {
    let { username, email, uid, phone_no } = req.body;
    let { limitV, pageV, sortV } = req.query;

    let limit = parseInt(limitV) || 5;
    let pageValue = parseInt(pageV) || 1;
    let skip = (pageValue - 1) * limit;

    // check phone number contains only digits
    let phone_no_pattern = /\d+/;
    if (!phone_no_pattern.test(phone_no) && phone_no) {
      return res.status(400).send({
        success: false,
        error: true,
        message: "phone number should be contain digits only",
      });
    }

    let andArray = [
      {
        username: { $regex: username ? username : "", $options: "i" },
        email: { $regex: email ? email : "", $options: "i" },
        phone_no: { $regex: phone_no ? phone_no : "", $options: "i" },
      },
    ];
    if (uid) {
      andArray.push({ uid: parseInt(uid) });
    }

    let pipeline = [];

    pipeline = [
      ...pipeline,
      {
        $match: {
          $and: andArray,
        },
      },
    ];

    if (sortV.search(" ") !== -1) {
      sortV = sortV.replace(" ", "_");
    }

    if (sortV.toLowerCase() !== "none") {
      if (sortV.toLowerCase() === "email") {
        pipeline.push({
          $addFields: {
            emailSort: { $toLower: "$email" },
          },
        });
        pipeline.push({
          $sort: { emailSort: 1 },
        });
      } else {
        pipeline.push({
          $sort: { [sortV]: 1 },
        });
      }
    }

    pipeline = [
      ...pipeline,
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    try {
      const users = await userModel.aggregate(pipeline);
      const count = await userModel.countDocuments({ $and: andArray });
      res.status(200).send({
        success: true,
        error: false,
        data: { users, count, limit, pageValue },
        message: "users fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  editUser: async (req, res) => {
    const {
      _id,
      username,
      email,
      phone_no,
      country,
      prefix,
      old_image,
      profile,
    } = req.body;
    if (req.file) {
      fs.unlink(`public/images/users/${old_image}`, (err) => {
        if (err) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "image not found",
          });
        }
      });
    }

    try {
      const response = await editUserData(
        {
          _id,
          username,
          email,
          phone_no,
          country,
          prefix,
          profile,
        },
        req.file ? req.file.filename : null
      );
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  deleteUser: async (req, res) => {
    let { _id } = req.query;
    _id = ObjectId.createFromHexString(_id);

    try {
      const user = await userModel.findOneAndDelete(
        { _id },
        { new: true, upsert: true }
      );

      fs.unlink(`public/images/users/${user.profile}`, (err) => {
        if (err) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "image not found",
          });
        }
      });

      await stripe.customers.del(user.custId);

      res.status(200).send({
        success: true,
        error: false,
        message: "user deleted successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
};
