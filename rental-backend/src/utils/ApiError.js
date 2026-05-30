class ApiError extends Error {
  constructor(statusCode = httpStatus.BAD_REQUEST, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default ApiError;
