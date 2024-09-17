const express = require("express");
const path = require("path");
const app = express();

// Serve the static files from the dist directory
app.use(express.static(path.join(__dirname, "dist/transport-frontend/browser")));

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
