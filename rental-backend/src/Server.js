import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import router from "./routes/index.js";
import env from "./config/env.config.js";

dotenv.config();

const app = express();

// Middleware
// allow parsing of JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// allow parsing of cookies
app.use(cookieParser());
// Routes
app.use("/api/v1", router);
// Global error handler
app.use(errorHandler);

const PORT = env.server.port;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
    });
  })
  .catch(() => {
    console.error(
      "Không thể kết nối với cơ sở dữ liệu. Máy chủ chưa khởi động.",
    );
    process.exit(1);
  });
