const { settingModel } = require("../../models/setting");
const { ObjectId } = require("mongodb");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  getSettings: async (req, res) => {
    try {
      const setting = await settingModel.findOne();
      res.status(200).send({
        success: true,
        error: false,
        message: "Settings fetched successfully",
        data: setting,
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal server error" });
    }
  },
  editSettings: async (req, res) => {
    let {
      _id,
      time,
      stops,
      stripeApiKey,
      stripePrivateKey,
      nodeMailerEmail,
      nodeMailerPassword,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNo,
    } = req.body;
    _id = ObjectId.createFromHexString(_id);

    time = parseInt(time);
    stops = parseInt(stops);
    try {
      await settingModel.findOneAndUpdate(
        { _id },
        {
          time,
          stops,
          stripeApiKey,
          stripePrivateKey,
          nodeMailerEmail,
          nodeMailerPassword,
          twilioAccountSid,
          twilioAuthToken,
          twilioPhoneNo,
        }
      );

      fs.writeFile(
        path.join(__dirname, "../../.env"),
        `
        DB_URL = mongodb://localhost:27017/final_project
        HOST = smtp-relay.brevo.com
        ATLAS_DB_URL = atlas_mongodb_link
        STRIPE_PUBLISHABLE_KEY = ${stripeApiKey}
        STRIPE_SECRET_KEY = ${stripePrivateKey}
        STRIPE_WEBHOOK_SECRET_KEY = stripe_webhook_key
        JWTSECRET = nosecretinadmin
        NODE_MAILER_EMAIL = ${nodeMailerEmail}
        NODE_MAILER_PASSWORD = ${nodeMailerPassword}
        TWILIO_ACCOUNT_SID = ${twilioAccountSid}
        TWILIO_AUTH_TOKEN = ${twilioAuthToken}
        TWILIO_PHONE_NO = ${twilioPhoneNo}
        `,
        function (err) {
          if (err) {
            console.log(err);
            throw new Error("Error in writing .env file");
          }
        }
      );

      res.status(200).send({
        success: true,
        error: false,
        message: "Settings updated successfully",
      });
    } catch (error) {
      res
        .status(500)
        .send({ error: error.message, message: "Internal server error" });
    }
  },
};
