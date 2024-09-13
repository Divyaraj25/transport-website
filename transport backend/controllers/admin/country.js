const { countryModel } = require("../../models/country");
const { addCountry } = require("../../database functions/CRUD_database");

module.exports = {
  getCountryData: async (req, res) => {
    try {
      const countries = await countryModel.find();
      res.status(200).send({
        success: true,
        error: false,
        message:
          countries.length > 0
            ? "country data fetched successfully"
            : "No countries Found",
        data: countries,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  searchCountry: async (req, res) => {
    const { search } = req.query;
    const regex = new RegExp(search, "i");
    try {
      const searchResults = await countryModel.find({
        name: { $regex: regex },
      });
      if (searchResults.length > 0) {
        res.status(200).send({
          success: true,
          error: false,
          message: "country data fetched successfully",
          data: searchResults,
        });
      } else {
        res.status(200).send({
          success: true,
          error: false,
          message: "No country Found",
          data: [],
        });
      }
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  storeCountryData: async (req, res) => {
    try {
      const response = await addCountry(req.body);
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getCountryDataForCity: async (req, res) => {
    try {
      const cityCountry = await countryModel.aggregate([
        {
          $project: {
            _id: 1,
            cca2: 1,
            lat_lng: 1,
            name: 1,
          },
        },
      ]);
      res.status(200).send({
        success: true,
        error: false,
        message: "country data for city fetched successfully",
        data: cityCountry,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getCountryDataForPricing: async (req, res) => {
    try {
      const pricingCountry = await countryModel.aggregate([
        {
          $project: {
            _id: 1,
            cca2: 1,
            currency_symbol: 1,
            name: 1,
          },
        },
      ]);
      res.status(200).send({
        success: true,
        error: false,
        message: "country data for pricing fetched successfully",
        data: pricingCountry,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getCountryCurrencySymbol: async (req, res) => {
    const { country } = req.query;
    try {
      const currencySymbol = await countryModel.aggregate([
        {
          $match: {
            name: country,
          },
        },
        {
          $project: {
            _id: 1,
            currency_symbol: 1,
          },
        },
      ]);
      res.status(200).send({
        success: true,
        error: false,
        message: "country currency symbol fetched successfully",
        data: currencySymbol,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getCountryDataForUsersAndDrivers: async (req, res) => {
    try {
      const usersCountry = await countryModel.aggregate([
        {
          $project: {
            _id: 1,
            call_code: 1,
            cca2: 1,
            name: 1,
          },
        },
      ]);
      res.status(200).send({
        success: true,
        error: false,
        message: "country data for users and drivers fetched successfully",
        data: usersCountry,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
};
