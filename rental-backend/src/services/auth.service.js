import { StatusCodes } from "http-status-codes";
import { ApiError, respone, jwt_utils } from "../utils/index.js";
import { userModel, roleModel, token } from "../models/index.js";
import bcrypt from "bcrypt";
import env from "../config/env.config.js";

const registerService = async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email already in use");
  }

  const defaultRole = await roleModel.findOne({ name: "User" });
  if (!defaultRole) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Default role 'User' is not configured",
    );
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const newUser = await userModel.create({
    username,
    email,
    password: hashedPassword,
    role: defaultRole._id,
  });
  return respone(StatusCodes.CREATED, "User registered successfully", {
    userId: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
};

const loginService = async (email, password, res) => {
  const user = await userModel.findOne({ email }).populate("role");
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
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
  return respone(StatusCodes.OK, "Login successful", {
    accessToken,
    user: userResponse,
  });
};

const refreshTokenService = async (tokenValue) => {
  if (!tokenValue) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "No refresh token provided");
  }
  const storedToken = await token.findOne({ refreshToken: tokenValue });
  if (!storedToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }
  let decoded;
  try {
    decoded = jwt_utils.verifyRefreshToken(tokenValue);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      await token.deleteOne({ refreshToken: tokenValue }); // remove expired token from database
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token expired");
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  if (storedToken.userId.toString() !== decoded.id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  const newAccessToken = jwt_utils.generateAccessToken(storedToken.userId);
  return respone(StatusCodes.OK, "Access token refreshed successfully", {
    accessToken: newAccessToken,
  });
};

const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No refresh token provided");
  }
  await token.deleteOne({ refreshToken: refreshToken }); // remove the refresh token from database
  return respone(StatusCodes.OK, "Logged out successfully");
};

export { registerService, loginService, refreshTokenService, logoutService };
