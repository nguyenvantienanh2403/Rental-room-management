import { StatusCodes } from "http-status-codes";
import env from "../config/env.config.js";
import sentryHelper from "../utils/sentry.js";
import { ApiError } from "../utils/index.js";

/**
 * Global error handling middleware.
 * - In development: returns detailed error info for debugging
 * - In production: returns generic message for operational errors,
 *   hides internals for unexpected programmer errors
 */
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Chuyển đổi lỗi Mongoose ValidationError thành ApiError (HTTP 400)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message).join(", ");
    error = new ApiError(StatusCodes.BAD_REQUEST, message);
  }

  // Chuyển đổi lỗi Mongoose CastError thành ApiError (HTTP 400)
  if (err.name === "CastError") {
    const message = `Định dạng trường ${err.path} không hợp lệ.`;
    error = new ApiError(StatusCodes.BAD_REQUEST, message);
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  // Always log the full error server-side for observability
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    statusCode,
    message: error.message,
    stack: error.stack,
  });

  // Capture unexpected server errors (500+) in Sentry
  if (statusCode >= 500) {
    sentryHelper.captureException(err, { // Gửi error gốc lên Sentry để có stacktrace đầy đủ
      extra: {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
      },
    });
  }

  // Determine safe message to send to client
  let clientMessage;

  if (env.server.isProduction) {
    // In production: only expose message for known operational errors
    // For unexpected errors (programmer bugs), send generic message
    clientMessage = error.isOperational
      ? error.message
      : "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
  } else {
    // In development: expose full message for easier debugging
    clientMessage = error.message || "Internal Server Error";
  }

  res.status(statusCode).json({
    statusCode,
    message: clientMessage,
  });
};

export default errorMiddleware;
