import { statusCodes } from "http-status-code";
import jwt from "jsonwebtoken";
import { ApiError, catchAsync, jwt_utils, respone } from "../utils/index.js";
import { userModel, token } from "../models/index.js";
import env from "../config/env.config.js";
import authService from "../services/index.js";
import bcrypt from "bcrypt";

const register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;
  const data = await authService.registerService({
    username,
    email,
    password,
  });
  res.status(statusCodes.CREATED).json(data);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.loginService(email, password, res);
  res.status(statusCodes.OK).json(data);
});
