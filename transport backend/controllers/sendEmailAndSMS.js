const nodemailer = require("nodemailer");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
  sendEmail: async (message, subject, email) => {
    try {
      let transporter = await nodemailer.createTransport({
        host: process.env.HOST,
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
          user: process.env.NODE_MAILER_EMAIL,
          pass: process.env.NODE_MAILER_PASSWORD,
        },
      });

      let info = await transporter.sendMail({
        from: '"Divyaraj makwana 👻" <divyaraj.makwana9425@gmail.com>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: message, // plain text body
      });
      return {
        success: true,
        error: false,
        message: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message: error.message,
      };
    }
  },
  sendSMS: async (message, contact) => {
    try {
      const msg = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NO,
        to: contact,
      });

      return {
        success: true,
        error: false,
        message: msg.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message: error.message,
      };
    }
  },
};
