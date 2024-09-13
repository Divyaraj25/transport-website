const { cityModel } = require("../models/city");
const { countryModel } = require("../models/country");
const { vehicleModel } = require("../models/vehicle-type");
const { pricingModel } = require("../models/pricing");
const { userModel } = require("../models/user");
const { createUidModel } = require("../models/identityCounter");
const { driverModel } = require("../models/driver");
const { ridesModel } = require("../models/ride");
const { sendEmail } = require("../controllers/sendEmailAndSMS");

module.exports = {
  /*
  identity counters database errors catch here
  */

  addIdentityCounterPlugin: async (schema, options) => {
    schema.statics.addIdentityCounter = async function (model, field) {
      const newIdentityCounter = new createUidModel({
        model,
        field,
      });
      try {
        await newIdentityCounter.save();
        return {
          success: true,
          error: false,
          status: 201,
          message: "identity counter for model added successfully",
        };
      } catch (e) {
        return {
          success: false,
          error: true,
          status: 400,
          message: e.message,
        };
      }
    };

    schema.plugin(function (schema) {
      schema.pre("save", async function () {
        if (!this.isModified(options.field)) {
          await this.constructor.addIdentityCounter(
            options.model,
            options.field
          );
        }
      });
    });
  },

  /*
  check email and phone_no for conflict error
  */

  checkUserEmailAndPhone: async (model, email, phone_no) => {
    try {
      const emailFound = await model.findOne({ email });
      if (emailFound) {
        return {
          success: false,
          error: true,
          status: 409,
          message: "Email in use, Please try other email",
        };
      } else {
        try {
          const phoneFound = await model.findOne({ phone_no });
          if (phoneFound) {
            return {
              success: false,
              error: true,
              status: 409,
              message: "Phone number in use, Please try other phone number",
            };
          } else {
            return {
              success: true,
              error: false,
              status: 200,
              message: "You can go further",
            };
          }
        } catch (error) {
          return {
            success: false,
            error: true,
            status: 500,
            message: error.message,
          };
        }
      }
    } catch (err) {
      return {
        success: false,
        error: true,
        status: 500,
        message: err.message,
      };
    }
  },

  /*
  country database errors catch here
  */
  addCountry: async (country) => {
    const newCountry = new countryModel(country);
    try {
      await newCountry.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "country added successfully",
      };
    } catch (e) {
      return {
        success: false,
        error: true,
        status: 409,
        message: e.message,
      };
    }
  },

  /*
  vehicle database errors catch here
  */
  addVehicle: async (vehicle_type, vehicle_image_file) => {
    const newVehicle = new vehicleModel({
      vehicle_type,
      vehicle_image: vehicle_image_file ? vehicle_image_file.filename : null,
    });
    try {
      await newVehicle.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "vehicle added successfully",
      };
    } catch (e) {
      return {
        success: false,
        error: true,
        status: 409,
        message: e.message,
      };
    }
  },

  editVehicle: async (vehicle_id, body, file) => {
    let cleared = body.clear ? null : body.old_image;
    let vehicleOldImage = body.old_image ? cleared : null;

    try {
      await vehicleModel.findByIdAndUpdate(
        vehicle_id,
        {
          vehicle_type: body.vehicle_type,
          vehicle_image: file ? file.filename : vehicleOldImage,
        },
        { new: true }
      );
      return {
        success: true,
        error: false,
        status: 200,
        message: "vehicle edited successfully",
      };
    } catch (e) {
      let msg;
      if (e.code === 11000) {
        msg = "This vehicle type is already registered";
        return {
          success: false,
          error: true,
          status: 409,
          message: msg,
        };
      }
      return {
        success: false,
        error: true,
        status: 409,
        message: e.message,
      };
    }
  },

  /*
  city database errors catch here
  */

  addCity: async (newCityWithZone) => {
    const { country, city, cca2, zone } = newCityWithZone;
    const cityAdd = new cityModel({
      country,
      city,
      zone,
      cca2,
    });
    try {
      await cityAdd.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "city added successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        status: 409,
        message: error.message,
      };
    }
  },

  /*
  city database errors catch here
  */

  addPricingData: async (body) => {
    const pricing = new pricingModel(body);
    try {
      await pricing.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "pricing added successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        status: 409,
        message: e.message,
      };
    }
  },

  /*
  user database errors catch here
  */

  addUserData: async (body, file) => {
    const { filename } = file;
    const { email, phone_no, username, prefix, country } = body;
    const user = new userModel({
      email,
      phone_no,
      username,
      prefix,
      country,
      profile: filename,
    });
    try {
      await user.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "user added successfully",
      };
    } catch (e) {
      return {
        success: false,
        error: true,
        status: 400,
        message: e.message,
      };
    }
  },

  editUserData: async (body, file) => {
    const { _id, country, username, email, profile, prefix, phone_no } = body;
    try {
      const editUser = await userModel.findOneAndUpdate(
        { _id },
        {
          country,
          username,
          email,
          phone_no,
          prefix,
          profile: file ? file : profile,
        }
      );
      return {
        success: true,
        error: false,
        status: 200,
        message: "user updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        status: 409,
        message: error.message,
      };
    }
  },
  addDriverData: async (body, file) => {
    const { filename } = file;
    const { email, phone_no, username, prefix, country, city } = body;
    const driver = new driverModel({
      email,
      phone_no,
      username,
      prefix,
      country,
      city,
      profile: filename,
    });
    try {
      await driver.save();

      const welcome = await sendEmail(
        "welcome to transportation world, you can drive now",
        "Welcome Email 🥳",
        driver.email
      );

      return {
        success: true,
        error: false,
        status: 201,
        message: {
          general: "driver added successfully",
          driver: welcome.message,
        },
      };
    } catch (e) {
      return {
        success: false,
        error: true,
        status: 400,
        message: e.message,
      };
    }
  },
  editDriverData: async (body, file) => {
    const { _id, country, city, username, email, profile, prefix, phone_no } =
      body;
    try {
      await driverModel.findOneAndUpdate(
        { _id },
        {
          country,
          city,
          username,
          email,
          phone_no,
          prefix,
          profile: file ? file : profile,
        }
      );
      return {
        success: true,
        error: false,
        status: 200,
        message: "driver updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        status: 409,
        message: error.message,
      };
    }
  },
  addDataOfRide: async (
    userUID,
    profile,
    username,
    email,
    phone_no,
    country,
    city,
    payment_method,
    custId,
    cardId,
    vehicle_type,
    vehicle_image,
    base_prize,
    prize_per_distance,
    prize_per_time,
    min_fare,
    total_fare,
    time,
    distance,
    source,
    destination,
    stops,
    sourceLatLng,
    destinationLatLng,
    stopsLatLng,
    dateTime
  ) => {
    if (payment_method == "cash") {
      custId = null;
      cardId = null;
    }

    const newRide = new ridesModel({
      userUID,
      profile,
      username,
      email,
      phone_no,
      country,
      city,
      payment_method,
      custId,
      cardId,
      vehicle_type,
      vehicle_image,
      base_prize,
      prize_per_distance,
      prize_per_time,
      min_fare,
      total_fare,
      time,
      distance,
      source,
      destination,
      stops,
      stopNumber: stops.length,
      sourceLatLng,
      destinationLatLng,
      stopsLatLng,
      dateTime,
    });

    try {
      await newRide.save();
      return {
        success: true,
        error: false,
        status: 201,
        message: "ride booked successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        status: 409,
        message: error.message,
      };
    }
  },
};
