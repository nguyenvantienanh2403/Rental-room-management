import { StatusCodes } from "http-status-codes";

/**
 * Custom operational error class.
 * Distinguishes intentional API errors from unexpected programmer errors.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (default: 400 Bad Request)
   * @param {string} message    - Human-readable error message
   */
  constructor(statusCode = StatusCodes.BAD_REQUEST, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true; // Marks this as an expected operational error
  }
}

export default ApiError;
