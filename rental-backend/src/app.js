import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import router from "./routes/index.js";

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

export default app;
