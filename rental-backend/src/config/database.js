import mongoose from "mongoose";
import env from "./env.config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.database.mongoURI);
    console.log("MongoDB đã được kết nối thành công");
  } catch (error) {
    console.error("Kết nối MongoDB thất bại", error);
    process.exit(1);
  }
};

export default connectDB;
