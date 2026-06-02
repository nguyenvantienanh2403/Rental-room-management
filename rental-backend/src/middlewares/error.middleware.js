import { StatusCodes } from "http-status-codes";

const errorMiddleware = (err, req, res, next) => {
  console.error("Lỗi được phát hiện bởi Middleware: " + err);
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    statusCode,
    message,
  });
};

export default errorMiddleware;
