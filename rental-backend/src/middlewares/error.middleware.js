import { StatusCodes } from "http-status-codes";
import env from "../config/env.config.js";

/**
 * Global error handling middleware.
 * - In development: returns detailed error info for debugging
 * - In production: returns generic message for operational errors,
 *   hides internals for unexpected programmer errors
 */
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  // Always log the full error server-side for observability
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    statusCode,
    message: err.message,
    stack: err.stack,
  });

  // Determine safe message to send to client
  let clientMessage;

  if (env.server.isProduction) {
    // In production: only expose message for known operational errors
    // For unexpected errors (programmer bugs), send generic message
    clientMessage = err.isOperational
      ? err.message
      : "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
  } else {
    // In development: expose full message for easier debugging
    clientMessage = err.message || "Internal Server Error";
  }

  res.status(statusCode).json({
    statusCode,
    message: clientMessage,
  });
};

export default errorMiddleware;
