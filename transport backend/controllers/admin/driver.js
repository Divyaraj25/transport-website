const fs = require("node:fs");
const { ObjectId } = require("mongodb");
const { driverModel } = require("../../models/driver");
const {
  addDriverData,
  editDriverData,
  checkUserEmailAndPhone,
} = require("../../database functions/CRUD_database");

module.exports = {
  addDriver: async (req, res) => {
    const { email, phone_no } = req.body;
    const response = await checkUserEmailAndPhone(driverModel, email, phone_no);
    if (response.status === 200) {
      try {
        const response = await addDriverData(req.body, req.file);
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
  getDrivers: async (req, res) => {
    let { page, sortV, limitV } = req.query;

    if (sortV.search(" ") !== -1) {
      sortV = sortV.replace(" ", "_");
    }

    let limit = parseInt(limitV) || 5;
    let pageValue = parseInt(page) || 1;
    let skip = (pageValue - 1) * limit;
    let count = await driverModel.countDocuments();
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
      const drivers = await driverModel.aggregate(pipeline);
      res.status(200).send({
        success: true,
        error: false,
        data: { drivers, count, limit, pageValue },
        message: "drivers fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getDriversForRide: async (req, res) => {
    const { city, vehicle_type } = req.query;
    const { rideId } = req.body;
    let pipeline = {
      city,
      vehicle_type,
      ridesId: { $nin: [rideId] },
      approved: true,
      available: true,
    };

    try {
      const drivers = await driverModel.find(pipeline);
      res.status(200).send({
        success: true,
        error: false,
        data: drivers,
        message:
          drivers.length > 0
            ? "drivers found in this city"
            : "no drivers found in this city",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  searchDriver: async (req, res) => {
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
      const drivers = await driverModel.aggregate(pipeline);
      const count = await driverModel.countDocuments({ $and: andArray });
      res.status(200).send({
        success: true,
        error: false,
        data: { drivers, count, limit, pageValue },
        message: "drivers fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  editDriver: async (req, res) => {
    const {
      _id,
      username,
      email,
      phone_no,
      country,
      city,
      prefix,
      old_image,
      profile,
    } = req.body;
    if (req.file) {
      fs.unlink(`public/images/drivers/${old_image}`, (err) => {
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
      const response = await editDriverData(
        {
          _id,
          username,
          email,
          phone_no,
          country,
          city,
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
  deleteDriver: async (req, res) => {
    let { _id } = req.query;
    _id = ObjectId.createFromHexString(_id);

    try {
      const driver = await driverModel.findOneAndDelete(
        { _id },
        { new: true, upsert: true }
      );

      fs.unlink(`public/images/drivers/${driver.profile}`, (err) => {
        if (err) {
          return res.status(404).send({
            success: false,
            error: true,
            message: "image not found",
          });
        }
      });

      res.status(200).send({
        success: true,
        error: false,
        message: "driver deleted successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  assignVehicleServiceToDriver: async (req, res) => {
    let { _id, vehicle_type, vehicle_image } = req.body;
    if (vehicle_type === "none") {
      vehicle_type = null;
      vehicle_image = null;
    }
    _id = ObjectId.createFromHexString(_id);
    try {
      const update = await driverModel.findOneAndUpdate(
        { _id },
        { vehicle_type, vehicle_image },
        { new: true, upsert: true }
      );
      res.status(200).send({
        success: true,
        error: false,
        message: "vehicle service assigned successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  approveDriver: async (req, res) => {
    let { _id, approved } = req.body;
    _id = ObjectId.createFromHexString(_id);
    try {
      const driver = await driverModel.findOneAndUpdate(
        { _id },
        { approved: !approved },
        { new: true, upsert: true }
      );
      res.status(200).send({
        success: true,
        error: false,
        message: driver.approved
          ? "driver approved successfully"
          : "driver disapproved successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
};
