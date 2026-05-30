import { statusCode } from "http-status-code";
import { ApiError, catchAsync, respone, jwt_utils } from "../utils/index.js";
import { userModel, token } from "../models/index.js";
import bcrypt from "bcrypt";
import env from "../config/env.config.js";

const registerService = catchAsync(async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(statusCode.BAD_REQUEST, "Email already in use");
  }
  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const newUser = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });
  return respone(statusCode.CREATED, "User registered successfully", {
    userId: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
});

const loginService = catchAsync(async (email, password) => {
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new ApiError(statusCode.UNAUTHORIZED, "Invalid email or password");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(statusCode.UNAUTHORIZED, "Invalid email or password");
  }
  const accessToken = jwt_utils.generateAccessToken({ UserId: user._id });
  const refreshToken = jwt_utils.generateRefreshToken({ UserId: user._id });

  // Store refresh token in database or cache for later verification
  await token.create({ user: user._id, refreshToken, expiresAt: new Date() });

  // setup cookie options
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // only accessible by the server
    secure: env.NODE_ENV === "production", // only send over HTTPS in production
    sameSite: env.NODE_ENV === "production" ? "None" : "Lax", // allow cross-site cookies in production
    maxAge: env.jwt.refreshTokenExpiresIn * 1000, // convert to milliseconds
  });

  const userResponse = user.toObject();
  delete userResponse.password; // remove password from response
  return respone(statusCode.OK, "Login successful", {
    accessToken,
    user: userResponse,
  });
});

export { registerService, loginService };
