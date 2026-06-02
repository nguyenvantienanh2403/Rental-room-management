import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { ApiError, catchAsync, jwt_utils, respone } from "../utils/index.js";
import { userModel, token } from "../models/index.js";
import env from "../config/env.config.js";
import { authService } from "../services/index.js";
import bcrypt from "bcrypt";

const register = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  const data = await authService.registerService(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.loginService(email, password, res);
  res.status(StatusCodes.OK).json(data);
});

const refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const data = await authService.refreshTokenService(refreshToken);
  res.status(StatusCodes.OK).json(data);
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const data = await authService.logoutService(refreshToken);
  res.status(StatusCodes.OK).json(data);
});

const getMe = catchAsync(async (req, res) => {
  const user = req.user;
  res
    .status(StatusCodes.OK)
    .json(respone(StatusCodes.OK, "Lấy thông tin người dùng thành công", user));
});

export { register, login, refreshToken, logout, getMe };
