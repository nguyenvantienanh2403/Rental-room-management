import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { ApiError, catchAsync, jwt_utils } from "../utils/index.js";
import { userModel } from "../models/index.js";

const authMiddleware = catchAsync(async (req, res, next) => {
  const token = jwt_utils.extractToken(req);
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Không tìm thấy token");
  }
  let decoded;
  try {
    decoded = jwt_utils.verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Token đã hết hạn");
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Token không hợp lệ");
  }
  const user = await userModel
    .findById(decoded.id)
    .select("-password")
    .populate({
      path: "role",
      populate: { path: "permissions" },
    });
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Không tìm thấy người dùng");
  }
  req.user = user;
  next();
});

export default authMiddleware;
