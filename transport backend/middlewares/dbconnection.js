const mongoose = require("mongoose");
let error = false;

exports.connection = (req, res, next) => {
  // Step 1: Verify Network Configuration
  // Check for any network latency issues or firewall rules that might be affecting the connection
  const verifyNetwork = async () => {
    try {
      // Perform a simple network request to check connectivity
      await fetch("https://jsonplaceholder.typicode.com/todos");
      error = false;
    } catch (err) {
      console.error("Network configuration issue:", err);
      error = true;
      return res.status(503).send({
        error: true,
        success: false,
        message: "Network Error, Check your Internet",
      });
      // Handle the error or exit the application
    }
  };

  // Step 2: Use a Connection Pool
  // Consider using a connection pool to manage database connections efficiently
  const useConnectionPool = async () => {
    try {
      // Create a connection pool with a maximum and minimum pool size
      const options = {
        maxPoolSize: 10, // Maximum number of connections in the pool
        serverSelectionTimeoutMS: 5000, // Connection timeout in milliseconds
        heartbeatFrequencyMS: 5000, // Heartbeat interval in milliseconds
        bufferTimeoutMS: 30000, // Maximum time a connection can be idle before being removed
      };
      await mongoose.connect(process.env.ATLAS_DB_URL, options);
      // logger(mongoose.connection.readyState)
      error = false;
    } catch (err) {
      console.log("Failed ro connectr to mongoooo.................")
      console.error("Error connecting to the database:", err);
      error = true;
      return res.status(504).send({
        success: false,
        error: true,
        message: "Database connection failed",
      });
      // Handle the error or exit the application
    }
  };

  // Example usage
  async function main() {
    await verifyNetwork();
    if (!error) {
      await useConnectionPool();
      if (!error) {
        next();
      }
    }
  }

  main().catch((err) => {
    console.error("Error:", err);
    // Handle the error or exit the application
  });
};