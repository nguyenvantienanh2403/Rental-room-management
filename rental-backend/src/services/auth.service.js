import { StatusCodes } from "http-status-codes";
import { ApiError, respone, jwt_utils } from "../utils/index.js";
import { userModel, roleModel, token } from "../models/index.js";
import bcrypt from "bcrypt";
import env from "../config/env.config.js";

const registerService = async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email đã được sử dụng");
  }

  const defaultRole = await roleModel.findOne({ name: "User" });
  if (!defaultRole) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Chưa cấu hình role mặc định 'User'",
    );
  }

  const newUser = await userModel.create({
    username,
    email,
    password,
    role: defaultRole._id,
  });
  return respone(StatusCodes.CREATED, "Đăng ký thành công", {
    userId: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
};

const loginService = async (email, password, res) => {
  const user = await userModel.findOne({ email }).populate("role");
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Email hoặc mật khẩu không hợp lệ");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Email hoặc mật khẩu không hợp lệ");
  }
  const accessToken = jwt_utils.generateAccessToken(user._id);
  const refreshToken = jwt_utils.generateRefreshToken(user._id);

  // Store refresh token in database or cache for later verification
  await token.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(),
  });
  // setup cookie options
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // only accessible by the server
    secure: env.server.nodeEnv === "production", // only send over HTTPS in production
    sameSite: env.server.nodeEnv === "production" ? "None" : "Lax", // allow cross-site cookies in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const userResponse = user.toObject();
  delete userResponse.password; // remove password from response
  return respone(StatusCodes.OK, "Đăng nhập thành công", {
    accessToken,
    user: userResponse,
  });
};

const refreshTokenService = async (tokenValue) => {
  if (!tokenValue) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Không tìm thấy refresh token");
  }
  const storedToken = await token.findOne({ refreshToken: tokenValue });
  if (!storedToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token không hợp lệ");
  }
  let decoded;
  try {
    decoded = jwt_utils.verifyRefreshToken(tokenValue);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      await token.deleteOne({ refreshToken: tokenValue }); // remove expired token from database
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token đã hết hạn");
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token không hợp lệ");
  }

  if (storedToken.userId.toString() !== decoded.id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token không hợp lệ");
  }

  const newAccessToken = jwt_utils.generateAccessToken(storedToken.userId);
  return respone(StatusCodes.OK, "Làm mới token thành công", {
    accessToken: newAccessToken,
  });
};

const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không tìm thấy refresh token");
  }
  await token.deleteOne({ refreshToken: refreshToken }); // remove the refresh token from database
  return respone(StatusCodes.OK, "Đăng xuất thành công");
};

export { registerService, loginService, refreshTokenService, logoutService };
