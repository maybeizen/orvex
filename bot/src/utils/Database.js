const mongoose = require("mongoose");
const logger = require("@lib/Logger");

class Database {
  constructor() {}

  async connect(uri, options) {
    try {
      const client = await mongoose.connect(uri, options);
      logger.success(`Connected to MongoDB | ${client.connection.host}`);
      return client;
    } catch (error) {
      logger.error(`Failed to connect to Database: ${error}`);
      logger.warn("Terminating node process to ensure data integrity...");
      process.exit(1);
    }
  }

  async destroy() {
    await mongoose.disconnect();
    logger.success("Disconnected from Database");
  }

  async client() {
    return mongoose;
  }
}

module.exports = Database;
