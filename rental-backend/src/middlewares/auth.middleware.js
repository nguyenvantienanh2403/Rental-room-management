import { statusCodes } from "http-status-code";
import jwt from "jsonwebtoken";
import { ApiError, catchAsync, jwt_utils } from "../utils/index.js";
import { userModel } from "../models/index.js";

const authMiddleware = catchAsync(async (req, res, next) => {
  const token = jwt_utils.extractToken(req);
  if (!token) {
    throw new ApiError(statusCodes.UNAUTHORIZED, "No token provided");
  }
  let decoded;
  try {
    decoded = jwt_utils.verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(statusCodes.UNAUTHORIZED, "Token expired");
    }
    throw new ApiError(statusCodes.UNAUTHORIZED, "Invalid token");
  }
  const user = await userModel.findById(decoded.UserId).select("-password");
  if (!user) {
    throw new ApiError(statusCodes.UNAUTHORIZED, "User not found");
  }
  req.user = user;
  next();
});

export default authMiddleware;
