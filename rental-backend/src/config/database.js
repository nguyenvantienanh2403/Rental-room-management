import mongoose from "mongoose";
import env from "./env.config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.database.mongoURI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
