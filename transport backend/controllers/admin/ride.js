const { settingModel } = require("../../models/setting");
const { addDataOfRide } = require("../../database functions/CRUD_database");
const { driverModel } = require("../../models/driver");
const { ridesModel } = require("../../models/ride");
const { pricingModel } = require("../../models/pricing");
const { ObjectId } = require("mongodb");
const { trusted } = require("mongoose");
const { sendSMS, sendEmail } = require("../sendEmailAndSMS");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
  createRide: async (req, res) => {
    let {
      user,
      source_Destination_Stops,
      Slatlng,
      Dlatlng,
      waypointsLatLng,
      time,
      distance,
      date,
      selectedServiceType,
      city,
      paymentMethod,
      cardId,
    } = req.body;

    const { username, email, phone_no, profile, custId, uid, country } = user;
    const { from, to, stops } = source_Destination_Stops;
    const {
      vehicle_type,
      vehicle_image,
      basePrize,
      prizePerDistance,
      prizePerTime,
      minFare,
      totalPrize,
    } = selectedServiceType;

    try {
      const response = await addDataOfRide(
        uid,
        profile,
        username,
        email,
        phone_no,
        country,
        city,
        paymentMethod,
        custId,
        cardId,
        vehicle_type,
        vehicle_image,
        basePrize,
        prizePerDistance,
        prizePerTime,
        minFare,
        totalPrize,
        time,
        distance,
        from,
        to,
        stops,
        Slatlng,
        Dlatlng,
        waypointsLatLng,
        date
      );
      res.status(response.status).send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getRideDetails: async (req, res) => {
    try {
      const rides = await ridesModel.aggregate([
        {
          $match: {
            status: { $nin: ["cancelled", "completed"] },
          },
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
      ]);
      res.status(200).send({
        error: false,
        success: true,
        data: rides,
        message: "Rides fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },

  getRunningRides: async (req, res) => {
    try {
      const rides = await ridesModel.aggregate([
        {
          $match: {
            status: {
              $nin: ["cancelled", "completed", "available"],
            },
          },
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
      ]);
      res.status(200).send({
        error: false,
        success: true,
        data: rides,
        message: "Running rides fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getHistoryRides: async (req, res) => {
    try {
      const rides = await ridesModel.aggregate([
        {
          $match: {
            $or: [{ status: "cancelled" }, { status: "completed" }],
          },
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
        {
          $unwind: {
            path: "$driver",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      res.status(200).send({
        error: false,
        success: true,
        data: rides,
        message: "History rides fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  getExportHistoryData: async (req, res) => {
    try {
      const rides = await ridesModel.aggregate([
        {
          $match: {
            $or: [{ status: "cancelled" }, { status: "completed" }],
          },
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
        {
          $unwind: {
            path: "$driver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            requestId: 1,
            customer_uid: "$userUID",
            customer: "$username",
            customer_email: "$email",
            customer_phone_no: "$phone_no",
            customer_country: "$country",
            customer_city: "$city",
            payment_method: 1,
            vehicle_type: 1,
            base_prize: 1,
            prize_per_time: 1,
            prize_per_distance: 1,
            min_fare: 1,
            total_fare: 1,
            time: 1,
            distance: 1,
            status: 1,
            source: 1,
            destination: 1,
            stopNumber: 1,
            dateTime: 1,
            driver_name: "$driver.username",
            driver_email: "$driver.email",
            driver_contact: "$driver.phone_no",
          },
        },
      ]);
      res.status(200).send({
        error: false,
        success: true,
        data: rides,
        message: "History rides fetched successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  cancelRide: async (req, res) => {
    let { _id } = req.body;
    _id = ObjectId.createFromHexString(_id);
    try {
      await ridesModel.findByIdAndUpdate(
        _id,
        { status: "cancelled" },
        { new: true }
      );
      res.status(200).send({
        error: false,
        success: true,
        message: "Ride cancelled successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal Server Error" });
    }
  },
  searchByValueInRide: async (req, res) => {
    let { searchBy, value, filterValue, filterBy } = req.body;
    let pipeline = {};
    if (!filterBy) {
      filterBy = "status";
    }
    if (!filterValue) {
      filterValue = "";
    }
    if (searchBy === "none") {
      if (filterValue === "pending") {
        pipeline = {
          $or: [
            { [filterBy]: { $eq: "pending" } },
            { [filterBy]: { $eq: "available" } },
          ],
        };
      } else {
        pipeline = {
          $and: [{ [filterBy]: { $regex: filterValue, $options: "i" } }],
        };
      }
    } else if (searchBy === "dateTime") {
      if (value) {
        value = new Date(value);
      }
      let next = "";
      if (value) {
        next = new Date(value);
        next = new Date(next.getTime() + 24 * 60 * 60 * 1000);
      }
      if (filterValue === "pending") {
        pipeline = {
          $and: [
            { status: { $ne: "cancelled" } },
            {
              [filterBy]: {
                $or: [{ $eq: "pending" }, { $eq: "available" }],
              },
            },
            {
              [searchBy]: {
                $gte: value,
                $lt: next,
              },
            },
          ],
        };
      } else {
        pipeline = {
          $and: [
            { status: { $ne: "cancelled" } },
            { [filterBy]: { $regex: filterValue, $options: "i" } },
            {
              [searchBy]: {
                $gte: value,
                $lt: next,
              },
            },
          ],
        };
      }
    } else {
      if (filterValue === "pending") {
        pipeline = {
          $and: [
            { status: { $ne: "cancelled" } },
            {
              [filterBy]: {
                $or: [{ $eq: "pending" }, { $eq: "available" }],
              },
            },
            {
              [searchBy]: {
                $regex: value,
                $options: "i",
              },
            },
          ],
        };
      } else {
        pipeline = {
          $and: [
            { status: { $ne: "cancelled" } },
            { [filterBy]: { $regex: filterValue, $options: "i" } },
            {
              [searchBy]: {
                $regex: value,
                $options: "i",
              },
            },
          ],
        };
      }
    }

    try {
      const search = await ridesModel.aggregate([
        {
          $match: pipeline,
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
      ]);

      res.status(200).send({
        success: true,
        error: false,
        data: search,
        message: search.length > 0 ? "search found" : "no rides found",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  searchByValueInHistory: async (req, res) => {
    let { value, searchBy, filterBy, filterValue, fromDate, toDate } = req.body;
    let pipeline;
    if (!filterValue || filterValue === "none") {
      filterValue = "";
    }
    if (!value || value === "none") {
      value = "";
    }
    if (searchBy === "none" || !searchBy) {
      searchBy = "source";
    }
    if (filterBy === "none" || !filterBy) {
      filterBy = "status";
    }
    if (filterBy) {
      if (filterBy === "dateTime") {
        let fromData = "";
        let toData = "";
        if (fromDate) {
          fromData = new Date(fromDate);
        }
        if (toDate) {
          toData = new Date(toDate);
          toData.setDate(toData.getDate() + 1);
        }
        pipeline = {
          $and: [
            {
              $or: [
                { status: { $eq: "completed" } },
                { status: { $eq: "cancelled" } },
              ],
            },
            {
              [filterBy]: {
                $gte: fromData,
                $lt: toData,
              },
            },
            {
              [searchBy]: {
                $regex: value,
                $options: "i",
              },
            },
          ],
        };
      } else if (filterBy !== "none") {
        pipeline = {
          $and: [
            {
              $or: [
                { status: { $eq: "completed" } },
                { status: { $eq: "cancelled" } },
              ],
            },
            {
              [filterBy]: {
                $regex: filterValue,
                $options: "i",
              },
            },
            {
              [searchBy]: {
                $regex: value,
                $options: "i",
              },
            },
          ],
        };
      }

      try {
        const search = await ridesModel.aggregate([
          {
            $match: pipeline,
          },
          {
            $lookup: {
              from: "drivers",
              localField: "driverId",
              foreignField: "_id",
              as: "driver",
            },
          },
          {
            $unwind: {
              path: "$driver",
              preserveNullAndEmptyArrays: true,
            },
          },
        ]);
        res.status(200).send({
          success: true,
          error: false,
          data: search,
          message: search.length > 0 ? "search found" : "no rides found",
        });
      } catch (error) {
        res.status(500).send({
          error: error.message,
          message: "Internal Server Error",
        });
      }
    }
    res.send();
  },
  driverAccepted: async (req, res) => {
    const { driverId, rideId } = req.body;
    try {
      const ride = await ridesModel.findOneAndUpdate(
        { _id: ObjectId.createFromHexString(rideId) },
        {
          status: "accepted",
          rejected: [],
          assignAny: false,
        }
      );

      const driver = await driverModel.findOneAndUpdate(
        { _id: ObjectId.createFromHexString(driverId) },
        {
          $addToSet: { ridesId: rideId },
          running: false,
          available: false,
        }
      );

      const { username } = driver;
      const { requestId } = ride;

      global.io.emit("accepted", {
        rideId: rideId,
        driverId: driverId,
        message: `accepted by ${username} for request id ${requestId}`,
      });

      global.io.emit("driver-status", {
        status: "accepted",
        rideId: rideId,
      });

      res.status(200).send({
        error: false,
        success: true,
        message: `${requestId} accepted by ${username}`,
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  driverRejected: async (req, res) => {
    const { driverId, rideId } = req.body;
    try {
      const ride = await ridesModel.findByIdAndUpdate(
        rideId,
        {
          driverId: null,
          assignedAt: null,
        },
        { new: true }
      );
      const driver = await driverModel.findById(driverId);

      if (!ride.assignAny) {
        await driverModel.findOneAndUpdate(
          { _id: ObjectId.createFromHexString(driverId) },
          {
            $unset: { ridesId: rideId },
            running: false,
          }
        );

        await ridesModel.findOneAndUpdate(
          { _id: ride._id },
          { status: "available", rejected: [], driverId: null }
        );

        global.io.emit("rejected-by-all", {
          rideId: rideId,
          message: `rejected by all drivers for request id ${ride.requestId}`,
        });
      } else {
        global.io.emit("rejected-by-driver", {
          message: `rejected by ${driver.username} for request id ${ride.requestId}`,
          rideId: rideId,
        });
      }

      res.status(200).send({
        error: false,
        success: true,
        message: "Ride rejected successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  assignDriver: async (req, res) => {
    const { driverId, rideId, assignAny } = req.body;
    if (driverId) {
      try {
        const driver = await driverModel.findOne({
          _id: ObjectId.createFromHexString(driverId),
          available: true,
        });

        if (driver) {
          try {
            const ride = await ridesModel.findOneAndUpdate(
              {
                _id: ObjectId.createFromHexString(rideId),
              },
              {
                assignAny: assignAny,
                driverId: driver._id,
                assignedAt: new Date(),
                status: "pending",
                rejected: [],
              },
              { new: true }
            );

            await driverModel.findOneAndUpdate(
              { _id: ObjectId.createFromHexString(driverId) },
              {
                $set: { running: true },
                $addToSet: { ridesId: ObjectId.createFromHexString(rideId) },
              }
            );

            // send io driver to frontend
            global.io.emit("display", {
              driverUsername: driver.username,
              status: "pending",
              rideId: rideId,
            });

            global.io.emit("driver", {
              driverId: driverId,
              ride: ride,
            });

            res.status(200).send({
              success: true,
              error: false,
              message: "Assigned to particular driver successfully",
            });
          } catch (error) {
            res.status(500).send({
              error: error.message,
              message: "Internal Server Error",
            });
          }
        } else {
          res.status(409).send({
            success: false,
            error: true,
            message: "Driver is not available Right now",
          });
        }
      } catch (error) {
        res.status(500).send({
          error: error.message,
          message: "Internal Server Error",
        });
      }
    } else {
      try {
        const ride = await ridesModel.findOne({
          _id: ObjectId.createFromHexString(rideId),
        });

        const availableDrivers = await driverModel.aggregate([
          {
            $match: {
              $and: [
                { city: ride.city },
                { vehicle_type: ride.vehicle_type },
                { available: true },
                { approved: true },
              ],
            },
          },
        ]);

        if (availableDrivers.length > 0) {
          const driver = await driverModel.findOneAndUpdate(
            {
              city: ride.city,
              vehicle_type: ride.vehicle_type,
              available: true,
              approved: true,
              running: false,
            },
            {
              $set: { running: true },
              $addToSet: { ridesId: ObjectId.createFromHexString(rideId) },
            },
            {
              new: true,
            }
          );

          if (driver) {
            const updatedRide = await ridesModel.findOneAndUpdate(
              { _id: ObjectId.createFromHexString(rideId) },
              {
                assignAny: assignAny,
                driverId: driver._id,
                assignedAt: new Date(),
                status: "pending",
                rejected: [],
              },
              { new: true }
            );

            // send io driver to frontend
            global.io.emit("display", {
              driverUsername: driver.username,
              status: "pending",
              rideId: rideId,
            });

            global.io.emit("driver", {
              driverId: driver._id,
              ride: updatedRide,
            });

            res.status(200).send({
              success: true,
              error: false,
              message: "Assigned to nearest driver successfully",
            });
          } else {
            await ridesModel.findOneAndUpdate(
              { _id: ObjectId.createFromHexString(rideId) },
              {
                assignAny: assignAny,
                assignedAt: null,
                driverId: null,
                status: "pending",
                rejected: [],
              },
              { new: true }
            );

            global.io.emit("display", {
              driverUsername: "On Hold",
              status: "pending",
              rideId: rideId,
            });
          }
        } else {
          res.status(409).send({
            error: true,
            success: false,
            message: "No Drivers are available right now",
          });
        }
      } catch (error) {
        res.status(500).send({
          error: error.message,
          message: "Internal Server Error",
        });
      }
    }
  },
  driverChangedStatusOfRide: async (req, res) => {
    const { driverId, status, rideId } = req.body;

    try {
      const ride = await ridesModel.findOneAndUpdate(
        { _id: ObjectId.createFromHexString(rideId) },
        { status: status },
        { new: true }
      );

      const { userModel } = require("../../models/user");

      const user = await userModel.findOne({
        phone_no: ride.phone_no,
      });

      let number = user.prefix + user.phone_no;

      const userSms = await sendSMS(
        status === "completed"
          ? `Your ride has been completed check for payments`
          : `Your status has been changed to ${status}`,
        number
      );

      if (status == "completed") {
        await driverModel.findOneAndUpdate(
          { _id: ObjectId.createFromHexString(driverId) },
          { available: true }
        );
      }

      global.io.emit("driver-status", {
        status: status,
        rideId: rideId,
      });
      res.status(200).send({
        success: true,
        error: false,
        message: {
          general:
            "Request Id: " + ride.requestId + " status changed to " + status,
          user: userSms.message,
        },
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
    res.send();
  },
  generateInvoice: async (req, res) => {
    const { rideId } = req.body;
    try {
      const ride = await ridesModel.findOne({
        _id: ObjectId.createFromHexString(rideId),
      });

      const driver = await driverModel.findOne({
        _id: ride.driverId,
      });

      const vehiclePricing = await pricingModel.findOne({
        vehicle_type: ride.vehicle_type,
        city: ride.city,
        country: ride.country,
      });

      let total_fare = ride.total_fare;
      let profit = vehiclePricing.driver_profit;
      let driverProfit = (total_fare * profit) / 100;

      let details = {
        rideId: rideId,
        requestId: ride.requestId,
        vehicle_type: ride.vehicle_type,
        payment_method: ride.payment_method,
        vehicle_image: ride.vehicle_image,
        driver_profit: vehiclePricing.driver_profit,
        driver_profit_in_currency: driverProfit,
        driver_username: driver.username,
        source: ride.source,
        destination: ride.destination,
        distance: ride.distance,
        base_prize: ride.base_prize,
        distance_base_prize: vehiclePricing.distance_base_prize,
        distance_prize: vehiclePricing.prize_per_distance,
        prize_per_distance: ride.prize_per_distance,
        prize_per_time: ride.prize_per_time,
        time_prize: vehiclePricing.prize_per_time,
        min_fare: ride.min_fare,
        total_fare: ride.total_fare,
        city: ride.city,
        country: ride.country,
      };

      res.status(200).send({
        success: true,
        error: false,
        data: details,
        message: "invoice created successfully",
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
  confirmPayment: async (req, res) => {
    const { rideId, rating } = req.body;
    try {
      const ride = await ridesModel.findOneAndUpdate(
        {
          _id: ObjectId.createFromHexString(rideId),
        },
        { rating: rating },
        { new: true }
      );

      const driver = await driverModel.findOne({
        _id: ride.driverId,
      });

      var intentId;
      // stripe payment here
      if (ride.payment_method === "card") {
        intentId = await stripe.paymentIntents.create({
          amount: parseInt(parseFloat(ride.total_fare).toFixed(2)) * 100,
          currency: "usd",
          description: `Payment from ${ride.username} for Ride RequestId : ${ride.requestId}`,
          customer: ride.custId,
          payment_method: ride.cardId,
          payment_method_types: ["card"],
          confirm: true,
        });
        await ridesModel.findOneAndUpdate(
          {
            _id: ObjectId.createFromHexString(rideId),
          },
          { paymentIntentId: intentId.id },
          { new: true }
        );
      }


      const driverInvoice = await sendEmail(
        `requestId : ${ride.requestId}\n\nTotal fare : ${ride.total_fare}\n\nPayment Method : ${ride.payment_method}\n\nPayment Confirmed`,
        "Invoice of Ride",
        driver.email
      );

      const userInvoice = await sendEmail(
        `requestId : ${ride.requestId}\n\nTotal fare : ${ride.total_fare}\n\nPayment Method : ${ride.payment_method}\n\nPayment Confirmed`,
        "Invoice of Ride",
        ride.email
      );

      res.status(200).send({
        success: true,
        error: false,
        message: {
          general: "payment confirmed successfully",
          driver: driverInvoice.message,
          user: userInvoice.message,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },
};
