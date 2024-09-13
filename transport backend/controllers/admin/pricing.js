const { addPricingData } = require("../../database functions/CRUD_database");
const { pricingModel } = require("../../models/pricing");
const { vehicleModel } = require("../../models/vehicle-type");

module.exports = {
  addPricing: async (req, res) => {
    try {
      const response = await addPricingData(req.body);
      res.status(response.status).send(response);
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  getRegisteredVehiclesOfCity: async (req, res) => {
    const { city } = req.query;
    try {
      const vehicles = await pricingModel.find({ city }).hint({ city: 1 });
      const vehiclesList = vehicles.map((vehicle) => vehicle.vehicle_type);
      const nonRegisteredVehicles = await vehicleModel.aggregate([
        {
          $match: {
            vehicle_type: {
              $nin: vehiclesList,
            },
          },
        },
      ]);
      res.status(200).send({
        success: true,
        error: false,
        data: nonRegisteredVehicles,
        message: "non registered vehicles for this city fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getPricingData: async (req, res) => {
    try {
      const pricingData = await pricingModel.find();
      res.status(200).send({
        success: true,
        error: false,
        data: pricingData,
        message: "pricing data fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  editPricing: async (req, res) => {
    const { city, vehicle_type } = req.query;
    try {
      await pricingModel
        .findOneAndUpdate({ city, vehicle_type }, req.body)
        .hint({ city: 1 });
      res.status(200).send({
        success: true,
        error: false,
        message: "pricing data edited successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  calculateVehiclePricing: async (req, res) => {
    const { city, minutes, kms } = req.body;
    try {
      const found = await pricingModel.find({
        city,
      });

      if (found.length > 0) {
        let vehiclePricingDetails = [];

        found.forEach((el) => {
          let basePrize = el.base_prize;
          let prizePerDistance = 0;
          let prizePerTime = 0;

          if (kms >= el.distance_base_prize.toFixed(2)) {
            let remainingKms = kms - el.distance_base_prize;
            prizePerDistance = el.prize_per_distance * remainingKms;
          } else {
            prizePerDistance = 0;
          }

          prizePerTime = el.prize_per_time * minutes;
          let totalPrize = basePrize + prizePerDistance + prizePerTime;
          if (totalPrize < el.min_fare) {
            totalPrize = el.min_fare;
          }

          let obj = {
            _id: el._id,
            vehicle_type: el.vehicle_type,
            vehicle_image: el.vehicle_image,
            prizePerDistance,
            prizePerTime,
            basePrize,
            minFare: el.min_fare,
            totalPrize,
          };

          vehiclePricingDetails.push(obj);
        });

        res.send({
          success: true,
          error: false,
          data: vehiclePricingDetails,
          message: "vehicle pricing details fetched successfully",
        });
      } else {
        res.send({
          success: false,
          error: true,
          data: [],
          message: "vehicle pricing details not found",
        });
      }
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
};
