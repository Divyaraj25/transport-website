const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("node:path");

// controllers
const {
  getCountryData,
  storeCountryData,
  getCountryDataForCity,
  searchCountry,
  getCountryDataForPricing,
  getCountryDataForUsersAndDrivers,
  getCountryCurrencySymbol,
} = require("../controllers/admin/country");
const {
  storeVehicle,
  getVehicles,
  editVehicle,
} = require("../controllers/admin/vehicle-type");
const {
  getCities,
  addCity,
  editCityZone,
  checkCity,
  checkZone,
  getCitiesForPricing,
  getCityDataForUsersAndDrivers,
  checkFromLocationFromCityZone,
} = require("../controllers/admin/city");
const {
  addPricing,
  getRegisteredVehiclesOfCity,
  getPricingData,
  editPricing,
  calculateVehiclePricing,
} = require("../controllers/admin/pricing");
const {
  addUser,
  getUsers,
  searchUsers,
  editUser,
  deleteUser,
  addCard,
  deleteCard,
  setDefaultCard,
} = require("../controllers/admin/user");
const {
  getDrivers,
  addDriver,
  editDriver,
  deleteDriver,
  searchDriver,
  assignVehicleServiceToDriver,
  approveDriver,
  getDriversForRide,
} = require("../controllers/admin/driver");
const { getSettings, editSettings } = require("../controllers/admin/settings");
const {
  createRide,
  getRideDetails,
  searchByValueInRide,
  cancelRide,
  getRunningRides,
  driverAccepted,
  driverRejected,
  driverChangedStatusOfRide,
  getHistoryRides,
  getExportHistoryData,
  searchByValueInHistory,
  generateInvoice,
  confirmPayment,
  assignDriver,
} = require("../controllers/admin/ride");

// middlewares
const { verification } = require("../middlewares/verification");

// this is for all formdata

// this is for vehicle storage
const vehicleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images/vehicles"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// this is for driver storage
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images/drivers"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// this is for user storage
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images/users"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg and png are allowed"), false);
  }
};

// =>  multer options
// upload for vehicle
const vehicleUpload = multer({
  storage: vehicleStorage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
});

// upload for driver
const driverUpload = multer({
  storage: driverStorage,
  fileFilter,
});

// upload for user
const userUpload = multer({
  storage: userStorage,
  fileFilter,
});

router.use(verification);

// country api
router.get("/countries", getCountryData); //
router.get("/countryCurrencySymbol", getCountryCurrencySymbol);
router.get("/searchCountry", searchCountry); //
router.get("/cityCountries", getCountryDataForCity);
router.get("/pricingCountries", getCountryDataForPricing);
router.get("/userAndDriverCountries", getCountryDataForUsersAndDrivers);
router.post("/country", storeCountryData); //

// vehicle type api
router.get("/vehicles", getVehicles); //
router.post("/vehicle", vehicleUpload.single("vehicle_image"), storeVehicle); //
router.post("/editvehicle", vehicleUpload.single("vehicle_image"), editVehicle); //

// city api
router.get("/cities", getCities); //
router.get("/pricingCities", getCitiesForPricing);
router.get("/userAndDriverCities", getCityDataForUsersAndDrivers);
router.post("/city", addCity); //
router.post("/editCityZone", editCityZone); //
router.post("/checkCity", checkCity); //
router.post("/checkZone", checkZone); //
router.post("/checkFromLocation", checkFromLocationFromCityZone);

// pricing api
router.get("/getVehiclesOfCity", getRegisteredVehiclesOfCity);
router.get("/pricingData", getPricingData); //
router.post("/pricing", addPricing); //
router.post("/editpricing", editPricing); //
router.post("/calculateVehiclePricing", calculateVehiclePricing);

// users api
router.get("/users", getUsers); //
router.post("/searchUser", searchUsers); //
router.post("/user", userUpload.single("profile"), addUser); //
router.post("/editUser", userUpload.single("profile"), editUser); //
router.delete("/deleteUser", deleteUser); //

// users card api
router.post("/card", addCard);
router.post("/setDefaultCard", setDefaultCard);
router.delete("/deleteCard", deleteCard);

// drivers api
router.get("/drivers", getDrivers); //
router.post("/driverForRide", getDriversForRide);
router.post("/driver", driverUpload.single("profile"), addDriver);
router.post("/editDriver", driverUpload.single("profile"), editDriver);
router.post("/assignServiceToDriver", assignVehicleServiceToDriver);
router.post("/approveDriver", approveDriver);
router.post("/searchDriver", searchDriver);
router.delete("/deleteDriver", deleteDriver);

//setting api
router.get("/settings", getSettings);
router.post("/settings", editSettings);

// rides api
router.get("/getRides", getRideDetails);
router.get("/getRunningRides", getRunningRides);
router.get("/history", getHistoryRides);
router.get("/exportData", getExportHistoryData);
router.post("/createRide", createRide);
router.post("/deleteRide", cancelRide);
router.post("/searchRide", searchByValueInRide);
router.post("/searchHistory", searchByValueInHistory);
router.post("/assignDriver", assignDriver);
router.post("/acceptRide", driverAccepted);
router.post("/rejectRide", driverRejected);
router.post("/statusChange", driverChangedStatusOfRide);
router.post("/getInvoice", generateInvoice);
router.post("/confirmPayment", confirmPayment);

module.exports = router;
