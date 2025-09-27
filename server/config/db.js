const mongoose = require("mongoose");

async function connectDB() {
  const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/yourdbname";
  console.log("Connecting to Mongo:", MONGO_URL);
  try {
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
      // Helps in dev when connecting to a single host
      directConnection: /127\.0\.0\.1|localhost/.test(MONGO_URL),
    });
    console.log("MongoDB connected to", MONGO_URL);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("error", (e) => console.error("Mongo error:", e.message));
  mongoose.connection.on("disconnected", () => console.warn("Mongo disconnected"));
}

module.exports = connectDB;