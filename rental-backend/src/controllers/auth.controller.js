import { StatusCodes } from "http-status-codes";
import { ApiError, catchAsync, jwt_utils, response, sendEmail } from "../utils/index.js";
import { userModel, token } from "../models/index.js";
import env from "../config/env.config.js";
import { authService } from "../services/index.js";
import crypto from "crypto";
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
    .json(response(StatusCodes.OK, "Lấy thông tin người dùng thành công", user));
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  // 1. Tìm User theo email
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng với email này");
  }

  // 2. Tạo reset token ngẫu nhiên (chưa băm) và lưu bản băm vào DB
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Tạo URL reset password gửi qua email
  const resetURL = `${env.server.frontendUrl || process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng truy cập đường dẫn sau để đặt lại mật khẩu của bạn:\n\n${resetURL}\n\nĐường dẫn này có hiệu lực trong 15 phút.\nNếu bạn không yêu cầu đặt lại mật khẩu, xin hãy bỏ qua email này.`;

  try {
    // 4. Gửi email
    await sendEmail({
      email: user.email,
      subject: "Đặt lại mật khẩu của bạn (Có hiệu lực 15 phút)",
      message,
    });

    res.status(StatusCodes.OK).json(response(StatusCodes.OK, "Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn"));
  } catch (error) {
    // Nếu gửi email lỗi, phải xoá reset token trong DB để bảo mật
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.");
  }
});

const resetPassword = catchAsync(async (req, res) => {
  // 1. Lấy token từ params và băm nó bằng sha256 để đem đi so sánh với DB
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  // 2. Tìm user có passwordResetToken khớp và token chưa hết hạn
  const user = await userModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Token không hợp lệ hoặc đã hết hạn");
  }

  // 3. Cập nhật mật khẩu mới (Mongoose middleware sẽ tự động băm password mới)
  user.password = req.body.password;
  
  // 4. Xóa token cũ
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(StatusCodes.OK).json(response(StatusCodes.OK, "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."));
});

export { register, login, refreshToken, logout, getMe, forgotPassword, resetPassword };
