const { CronJob } = require("cron");
const { ridesModel } = require("../models/ride");
const { settingModel } = require("../models/setting");
const { driverModel } = require("../models/driver");
const { ObjectId } = require("mongodb");

exports.job = new CronJob(
  "*/30 * * * * *",
  async () => {
    console.log(
      `cron running ===== ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
    );
    try {
      const settings = await settingModel.find();

      const pendingRides = await ridesModel.aggregate([
        {
          $match: { status: "pending" },
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

      if (pendingRides.length > 0) {
        console.log(pendingRides.length);
        let updatedSeconds = new Date().getTime();
        pendingRides.forEach(async (ride) => {
          if (
            ride.assignedAt === null ||
            parseInt(settings[0].time) -
              Math.floor(updatedSeconds - ride.assignedAt.getTime()) / 1000 <=
              0
          ) {
            if (ride.assignAny) {
              // driver is now available
              await driverModel.findOneAndUpdate(
                { _id: ride.driverId || undefined },
                { running: false, $unset: { ridesId: ride._id } },
                { omitUndefined: true }
              );
              // update rejected array of ride
              await ridesModel.findOneAndUpdate(
                { _id: ride._id },
                { $addToSet: { rejected: ride.driverId } },
                { new: true }
              );

              const updatedRide = await ridesModel.findOne({ _id: ride._id });
              // find available drivers
              const availableDrivers = await driverModel.aggregate([
                {
                  $match: {
                    $and: [
                      { _id: { $nin: updatedRide.rejected } },
                      { city: ride.city },
                      { vehicle_type: ride.vehicle_type },
                      { available: true },
                      { approved: true },
                    ],
                  },
                },
              ]);

              if (availableDrivers.length > 0) {
                // find other driver
                const driver = await driverModel.findOneAndUpdate(
                  {
                    _id: { $nin: updatedRide.rejected },
                    city: ride.city,
                    vehicle_type: ride.vehicle_type,
                    available: true,
                    approved: true,
                    running: false,
                  },
                  {
                    $set: { running: true },
                    $addToSet: { ridesId: ride._id },
                  },
                  { new: true }
                );

                if (driver) {
                  const secondTimeUpdatedRide =
                    await ridesModel.findOneAndUpdate(
                      { _id: ride._id },
                      { driverId: driver._id, assignedAt: new Date() },
                      { new: true }
                    );

                  global.io.emit("display", {
                    driverUsername: driver.username,
                    status: "pending",
                    rideId: ride._id,
                  });

                  global.io.emit("driver", {
                    driverId: driver._id,
                    ride: secondTimeUpdatedRide,
                    seconds: secondTimeUpdatedRide.assignedAt.getSeconds(),
                  });
                } else {
                  await ridesModel.findOneAndUpdate(
                    {
                      _id: ride._id,
                    },
                    {
                      assignedAt: null,
                      driverId: null,
                    },
                    { new: true }
                  );

                  global.io.emit("display", {
                    driverUsername: "On Hold",
                    status: "pending",
                    rideId: ride._id,
                  });
                }
              } else {
                await ridesModel.findOneAndUpdate(
                  {
                    _id: ride._id,
                  },
                  { rejected: [], status: "available", driverId: null }
                );
                // send socket of rejected by all
                global.io.emit("rejected-by-all", {
                  rideId: ride._id,
                  message: `rejected by all drivers for request id: ${ride.requestId}`,
                });
              }
            } else {
              const driver = await driverModel.findOneAndUpdate(
                {
                  _id: ride.driverId,
                },
                {
                  running: false,
                  $unset: { ridesId: ride._id },
                }
              );

              await ridesModel.findOneAndUpdate(
                { _id: ride._id },
                { status: "available", rejected: [], driverId: null }
              );

              global.io.emit("rejected-by-all", {
                rideId: ride._id,
                message: `rejected by ${driver.username} for request id: ${ride.requestId}`,
              });
            }
          }
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  },
  null,
  false,
  "Asia/Kolkata"
);
