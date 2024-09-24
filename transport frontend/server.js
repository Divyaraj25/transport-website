// const express = require("express");
// const path = require("path");
// const app = express();
// const cors = require("cors");

// // Serve the static files from the dist directory
// app.use(
//   express.static(path.join(__dirname, "dist/transport-frontend/browser"))
// );

// // <<<<<<<<<<<<<<  ✨ Codeium Command ⭐  >>>>>>>>>>>>>>>>
// // enable cors
// // app.use(
// //   cors({
// //     origin: "*",
// //     methods: ["GET", "POST", "PUT", "DELETE"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //   })
// // );
// // <<<<<<<  333be887-6f4e-42a0-adf6-dc8a1d16b3b2  >>>>>>>
// // let cors = require("cors");
// // <<<<<<<<<<<<<<  ✨ Codeium Command 🌟  >>>>>>>>>>>>>>>>

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });


// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // if (!origin || whitelist.indexOf(origin) !== -1) {
//         callback(null, true);
//       // } else {
//       //   callback(new Error("Not allowed by CORS"));
//       // }
//     },
//   })
// );
// // let whitelist = [
// //   "http://13.61.1.58"
// // ];
// // let corsOptionsDelegate = function (req, callback) {
// //   let corsOptions;
// //   if (whitelist.indexOf(req.header("Origin")) !== -1) {
// //     corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
// //   } else {
// //     corsOptions = { origin: false }; // disable CORS for this request
// //   }
// //   callback(null, corsOptions); // callback expects two parameters: error and options
// // };

// // app.use(cors());
// // <<<<<<<  9ee01065-ca0f-473b-bbcf-c459c4c55d87  >>>>>>>

// // Catch all other routes and return the index file, so Angular can handle routing
// app.get("/*", function (req, res) {
//   res.sendFile(
//     path.join(__dirname, "dist/transport-frontend/browser/index.html")
//   );
// });

// // Start the app by listening on the default Heroku port or port 8080
// const PORT = process.env.PORT || 4200;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");

// Serve the static files from the dist directory
app.use(
  express.static(path.join(__dirname, "dist/transport-frontend/browser"))
);

// Enable CORS with flexible settings
// const cors = require('cors');
app.use(cors({
    origin: 'http://16.170.146.16:5000',
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // This is important for WebSocket if you're sending cookies or using sessions
}));


// app.use(
//   cors({
//     origin: "*", // Ideally, use your frontend domain here for production
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true, // This is important for WebSocket if you're sending cookies or using sessions
//   })
// );

// Custom headers for WebSocket support
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   next();
// });
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://16.170.146.16:5000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Catch all other routes and return the index file, so Angular can handle routing
app.get("/*", function (req, res) {
  res.sendFile(
    path.join(__dirname, "dist/transport-frontend/browser/index.html")
  );
});

// Start the app by listening on the default Heroku port or port 8080
const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
