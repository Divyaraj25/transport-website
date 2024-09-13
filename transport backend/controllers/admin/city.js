const { addCity } = require("../../database functions/CRUD_database");
const { cityModel } = require("../../models/city");

module.exports = {
  getCities: async (req, res) => {
    const { cca2 } = req.query;
    try {
      const cities = await cityModel.find({ cca2 });
      res.status(200).send({
        success: true,
        error: false,
        data: cities,
        message: "City data fetched successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  getCitiesForPricing: async (req, res) => {
    const { cca2 } = req.query;
    try {
      const cities = await cityModel.find({ cca2 }).select("city _id cca2");
      res.status(200).send({
        success: true,
        error: false,
        data: cities,
        message: "City data fetched successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  getCityDataForUsersAndDrivers: async (req, res) => {
    const { cca2 } = req.query;
    try {
      const usersCity = await cityModel.find({ cca2 }).select("city _id cca2");
      res.status(200).send({
        success: true,
        error: false,
        message: "country data for users and drivers fetched successfully",
        data: usersCity,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  addCity: async (req, res) => {
    const { country, city, cca2, zone } = req.body;

    let latlngObj = [];
    let lat_lng = [];
    for (let last of zone) {
      lat_lng.push(last.lng);
      lat_lng.push(last.lat);
      latlngObj.push(lat_lng);
      lat_lng = [];
    }

    lat_lng.push(zone[0].lng);
    lat_lng.push(zone[0].lat);
    latlngObj.push(lat_lng);

    const geojsonObj = {
      type: "Polygon",
      coordinates: [latlngObj],
    };

    const newCityWithZone = {
      country,
      city,
      cca2,
      zone: geojsonObj,
    };

    try {
      const response = await addCity(newCityWithZone);
      res.status(response.status).send(response);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  editCityZone: async (req, res) => {
    const { cca2, city, zone } = req.body;

    let latlngObj = [];
    let lat_lng = [];
    for (let last of zone) {
      lat_lng.push(last.lng);
      lat_lng.push(last.lat);
      latlngObj.push(lat_lng);
      lat_lng = [];
    }

    lat_lng.push(zone[0].lng);
    lat_lng.push(zone[0].lat);
    latlngObj.push(lat_lng);

    const geojsonObj = {
      type: "Polygon",
      coordinates: [latlngObj],
    };

    const editCityWithZone = {
      zone: geojsonObj,
    };

    try {
      await cityModel
        .findOneAndUpdate({ cca2, city }, editCityWithZone)
        .hint({ cca2: 1 });

      res.status(200).send({
        success: true,
        error: false,
        message: "City edited successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  checkCity: async (req, res) => {
    const { cca2, city } = req.body;
    try {
      const foundCity = await cityModel.find({ cca2, city }).hint({ cca2: 1 });
      if (foundCity.length > 0) {
        res.status(200).send({
          success: false,
          error: true,
          data: foundCity,
          message: "City Already Registered",
        });
      } else {
        res.status(200).send({
          success: true,
          error: false,
          message: "You can add this city",
        });
      }
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  checkZone: async (req, res) => {
    try {
      const { cca2, city, zone } = req.body;
      let latlngObj = [];
      let lat_lng = [];
      for (let last of zone) {
        lat_lng.push(last.lng);
        lat_lng.push(last.lat);
        latlngObj.push(lat_lng);
        lat_lng = [];
      }
      lat_lng.push(zone[0].lng);
      lat_lng.push(zone[0].lat);
      latlngObj.push(lat_lng);
      const geojsonObj = {
        type: "Polygon",
        coordinates: [latlngObj],
      };

      const zoneFound = await cityModel.find({
        cca2,
        zone: {
          $geoIntersects: {
            $geometry: geojsonObj,
          },
        },
      });
      let zonefounded = [];
      for (const zone of zoneFound) {
        if (zone.city !== city) {
          zonefounded.push(zone);
        }
      }
      if (zoneFound.length > 0) {
        res.status(200).send({
          success: false,
          error: true,
          data: zonefounded,
          message: "Zone is intersecting",
        });
      } else {
        res.status(200).send({
          success: true,
          error: false,
          data: [],
          message: "You can add this zone",
        });
      }
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  checkFromLocationFromCityZone: async (req, res) => {
    const { cca2, point } = req.body;

    for (let latlng of point) {
      if (latlng == null) {
        return res.status(400).send({
          success: false,
          error: true,
          message: "Please provide a valid address",
        });
      }
    }

    try {
      const found = await cityModel.find({
        cca2: cca2,
        zone: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: point,
            },
          },
        },
      });
      if (found.length > 0) {
        res.send({
          success: true,
          error: false,
          data: [found[0].city],
        });
      } else {
        res.send({
          success: false,
          error: true,
          data: found,
        });
      }
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
};
