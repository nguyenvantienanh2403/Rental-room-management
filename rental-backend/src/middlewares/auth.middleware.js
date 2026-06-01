import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { ApiError, catchAsync, jwt_utils } from "../utils/index.js";
import { userModel } from "../models/index.js";

const authMiddleware = catchAsync(async (req, res, next) => {
  const token = jwt_utils.extractToken(req);
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "No token provided");
  }
  let decoded;
  try {
    decoded = jwt_utils.verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Token expired");
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token");
  }
  const user = await userModel
    .findById(decoded.id)
    .select("-password")
    .populate({
      path: "role",
      populate: { path: "permissions" },
    });
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }
  req.user = user;
  next();
});

export default authMiddleware;
