const { vehicleModel } = require("../../models/vehicle-type");
const path = require("node:path");
const fs = require("node:fs");
const {
  addVehicle,
  editVehicle,
} = require("../../database functions/CRUD_database");

module.exports = {
  storeVehicle: async (req, res) => {
    const { vehicle_type } = req.body;
    try {
      const response = await addVehicle(vehicle_type, req.file);
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getVehicles: async (req, res) => {
    try {
      const vehicles = await vehicleModel.find();
      res.status(200).send({
        success: true,
        error: false,
        message:
          vehicles.length > 0
            ? "vehicle data fetched successfully"
            : "No vehicles Found",
        data: vehicles,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  editVehicle: async (req, res) => {
    if (req.file) {
      if (req.body.old_image) {
        fs.unlink(`public/images/vehicles/${req.body.old_image}`, (err) => {
          if (err) {
            return res.status(404).send({
              success: false,
              error: true,
              message: "image not found",
            });
          }
        });
      }
    }
    if (req.body.clear === "true") {
      if (req.body.old_image) {
        fs.unlink(`public/images/vehicles/${req.body.old_image}`, (err) => {
          if (err) {
            return res.status(404).send({
              success: false,
              error: true,
              message: "image not found",
            });
          }
        });
      }
    }
    try {
      const response = await editVehicle(
        req.query.vehicleId,
        req.body,
        req.file
      );
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
};
