import jwt from "jsonwebtoken";
import env from "../config/env.config.js";

//Lấy token từ header Authorization
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return token;
};

// Tạo access token
const generateAccessToken = (UserId) => {
  const payload = { id: UserId };
  const token = jwt.sign(payload, env.jwt.accessTokenSecret, {
    expiresIn: env.jwt.accessTokenExpiresIn,
  });

  return token;
};

// Tạo refresh token
const generateRefreshToken = (UserId) => {
  const payload = { id: UserId };

  const token = jwt.sign(payload, env.jwt.refreshTokenSecret, {
    expiresIn: env.jwt.refreshTokenExpiresIn,
  });

  return token;
};

//Giải mã access token
const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, env.jwt.accessTokenSecret);
  return decoded;
};

//Giải mã refresh token
const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, env.jwt.refreshTokenSecret);
  return decoded;
};

export default {
  extractToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
