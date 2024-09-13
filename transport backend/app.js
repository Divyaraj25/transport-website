require("dotenv").config();

const { job } = require("./cron-job/new-cron");
job.start();

const createError = require("http-errors");
const express = require("express");
const path = require("node:path");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connection } = require("./middlewares/dbconnection");

const loginRouter = require("./routes/login");
const adminRouter = require("./routes/admin");

const app = express();

// enable cors

// origin: (origin, callback) => {
//   callback(null, true);
// },
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
    credentials: true,
  })
);
// app.use(cors());
// app.use(cors({ credentials: true }));

// origin: "*",
// methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],

// view url in console
app.use(logger("dev"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set static folder
app.use(express.static(path.join(__dirname, "public")));

// middleware to check network error or database error
app.use(connection);

// routes
app.use(loginRouter);
app.use(adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
