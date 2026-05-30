import { statusCodes } from "http-status-code";

const errorMiddleware = (err, req, res, next) => {
  console.error("The error has been handled by middleware:" + err);
  const statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    statusCode,
    message,
  });
};

export default errorMiddleware;
