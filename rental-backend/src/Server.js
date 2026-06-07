import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import errorHandler from "./middlewares/error.middleware.js";
import router from "./routes/index.js";
import env from "./config/env.config.js";
import startCronJobs from "./scripts/cronJobs.js";
import mongoose from "mongoose";

dotenv.config();

// Structured logging for production environment
if (env.server.nodeEnv === "production") {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" "),
      })
    );
  };

  console.error = (...args) => {
    originalError(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message: args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" "),
      })
    );
  };
}

const app = express();

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------

// 1. Security headers (XSS protection, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// 2. CORS — allow requests from the configured frontend origin
app.use(
  cors({
    origin: env.server.frontendUrl,
    credentials: true, // Allow cookies (refresh token)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. General API rate limit — 100 req / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
  },
});

// ---------------------------------------------------------------------------
// Request Parsing Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// 1. Health check endpoint (Infrastructure monitor)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// 2. Apply general rate limiter to all API routes
app.use("/api/v1", apiLimiter, router);

// Global error handler — must be last
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Database connection & Server startup
// Cron jobs are started AFTER successful DB connection to prevent race conditions.
// ---------------------------------------------------------------------------
const PORT = env.server.port;

connectDB()
  .then(() => {
    // DB is ready — safe to start cron jobs now
    startCronJobs();
    const serverListener = app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT} (${env.server.nodeEnv})`);
    });

    const gracefulShutdown = () => {
      console.log("[SERVER] SIGTERM/SIGINT received. Shutting down gracefully...");
      serverListener.close(async () => {
        console.log("[SERVER] HTTP server closed.");
        try {
          await mongoose.connection.close();
          console.log("[SERVER] Database connection closed.");
          process.exit(0);
        } catch (err) {
          console.error("[SERVER] Error closing database connection", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  })
  .catch((err) => {
    console.error(
      "[FATAL] Cannot connect to database. Server did not start.",
      err.message,
    );
    process.exit(1);
  });
