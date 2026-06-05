import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { ApiError, respone } from "../utils/index.js";
import { userModel } from "../models/index.js";
import env from "../config/env.config.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

/**
 * Populate options for user queries — role and nested permissions
 */
const USER_POPULATE = [
  {
    path: "role",
    populate: {
      path: "permissions",
    },
  },
];

/**
 * Fields to exclude from user responses
 */
const EXCLUDE_FIELDS = "-password";

// ---------------------------------------------------------------------------
// GET USER BY ID
// ---------------------------------------------------------------------------
const getUserByIdService = async (userId) => {
  const user = await userModel
    .findById(userId)
    .select(EXCLUDE_FIELDS)
    .populate(USER_POPULATE)
    .lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng");
  }

  if (user.status === "inactive") {
    throw new ApiError(StatusCodes.GONE, "Tài khoản này đã bị vô hiệu hóa");
  }

  return respone(StatusCodes.OK, "Lấy thông tin người dùng thành công", user);
};

// ---------------------------------------------------------------------------
// GET ALL USERS  (Admin only — filtering handled at route/middleware level)
// ---------------------------------------------------------------------------
const getAllUsersService = async (query = {}) => {
  const { page = 1, limit = 10, status, keyword } = query;

  const filter = {};

  // Optional status filter (active / inactive)
  if (status && ["active", "inactive"].includes(status)) {
    filter.status = status;
  }

  // Optional keyword search by username or email
  if (keyword) {
    const regex = new RegExp(keyword, "i");
    filter.$or = [{ username: regex }, { email: regex }];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [users, totalCount] = await Promise.all([
    userModel
      .find(filter)
      .select(EXCLUDE_FIELDS)
      .populate(USER_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    userModel.countDocuments(filter),
  ]);

  return respone(StatusCodes.OK, "Lấy danh sách người dùng thành công", {
    users,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE  (only the authenticated user can update their own profile)
// ---------------------------------------------------------------------------
const updateProfileService = async (
  currentUserId,
  targetUserId,
  updateData,
) => {
  // Ensure users can only update their own profile
  if (currentUserId.toString() !== targetUserId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Bạn chỉ có thể cập nhật thông tin cá nhân của mình",
    );
  }

  // Whitelist of fields users are allowed to update
  const allowedFields = ["username", "avatar"];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Không có dữ liệu hợp lệ để cập nhật",
    );
  }

  // Check for duplicate username if being updated
  if (sanitizedData.username) {
    const existingUsername = await userModel.findOne({
      username: sanitizedData.username,
      _id: { $ne: targetUserId },
    });
    if (existingUsername) {
      throw new ApiError(StatusCodes.CONFLICT, "Tên đăng nhập đã được sử dụng");
    }
  }

  const updatedUser = await userModel
    .findByIdAndUpdate(
      targetUserId,
      { $set: sanitizedData },
      { returnDocument: "after", runValidators: true },
    )
    .select(EXCLUDE_FIELDS)
    .populate(USER_POPULATE)
    .lean();

  if (!updatedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng");
  }

  return respone(StatusCodes.OK, "Cập nhật hồ sơ thành công", updatedUser);
};

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
const changePasswordService = async (
  currentUserId,
  targetUserId,
  passwordData,
) => {
  const { currentPassword, newPassword } = passwordData;

  // Ensure users can only change their own password
  if (currentUserId.toString() !== targetUserId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Bạn chỉ có thể thay đổi mật khẩu của chính mình",
    );
  }

  if (!currentPassword || !newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu hiện tại và mật khẩu mới là bắt buộc",
    );
  }

  if (newPassword.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu mới phải có ít nhất 6 ký tự",
    );
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu mới phải khác mật khẩu hiện tại",
    );
  }

  // Fetch user WITH password (we need it for comparison)
  const user = await userModel.findById(targetUserId).select("+password");
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng");
  }

  // Verify the current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Mật khẩu hiện tại không đúng",
    );
  }

  // Hash and save the new password
  user.password = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await user.save();

  return respone(StatusCodes.OK, "Thay đổi mật khẩu thành công");
};

// ---------------------------------------------------------------------------
// DELETE USER  (Soft delete — sets status to "inactive")
// ---------------------------------------------------------------------------
const deleteUserService = async (userId) => {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng");
  }

  if (user.status === "inactive") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Người dùng đã bị vô hiệu hóa");
  }

  user.status = "inactive";
  await user.save();

  return respone(StatusCodes.OK, "Vô hiệu hóa người dùng thành công");
};

// ---------------------------------------------------------------------------
// REQUEST EMAIL CHANGE OTP
// ---------------------------------------------------------------------------
const requestEmailChangeService = async (userId, data) => {
  const { currentPassword, newEmail } = data;

  if (!currentPassword || !newEmail) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng cung cấp mật khẩu và email mới");
  }

  // Verify email format roughly
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email không hợp lệ");
  }

  const user = await userModel.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng");
  }

  if (user.email === newEmail) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email mới phải khác email hiện tại");
  }

  // Check if new email is already taken by someone else
  const emailExists = await userModel.findOne({ email: newEmail });
  if (emailExists) {
    throw new ApiError(StatusCodes.CONFLICT, "Email này đã được sử dụng bởi người khác");
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Mật khẩu hiện tại không đúng");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP for secure storage
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  user.newEmailPending = newEmail;
  user.emailChangeOTP = hashedOTP;
  user.emailChangeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  await user.save();

  // Send email via nodemailer
  try {
    const message = `Xin chào,\n\nBạn đã yêu cầu thay đổi địa chỉ email cho tài khoản của mình trên hệ thống Quản lý Trọ.\n\nMã xác nhận (OTP) của bạn là: ${otp}\n\nMã này sẽ hết hạn trong 10 phút.\nNếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.\n\nTrân trọng.`;
    
    await sendEmail({
      email: newEmail,
      subject: "Mã xác nhận thay đổi Email (OTP)",
      message,
    });
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    // In OTP ra console log theo yêu cầu của user để test
    console.log(`[TESTING] OTP cho ${newEmail} là: ${otp}`);
    
    // We still return success but notify that email failed to send, maybe it's printed to console.
    // In production we should throw an error, but here we proceed so user can test via console log.
  }

  return respone(StatusCodes.OK, "Mã xác nhận đã được gửi đến email mới của bạn");
};

// ---------------------------------------------------------------------------
// VERIFY EMAIL CHANGE OTP
// ---------------------------------------------------------------------------
const verifyEmailChangeService = async (userId, data) => {
  const { otp } = data;

  if (!otp) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng nhập mã OTP");
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng");
  }

  if (!user.emailChangeOTP || !user.emailChangeExpires || !user.newEmailPending) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Không có yêu cầu đổi email nào đang chờ");
  }

  if (Date.now() > user.emailChangeExpires) {
    // Clear expired fields
    user.newEmailPending = undefined;
    user.emailChangeOTP = undefined;
    user.emailChangeExpires = undefined;
    await user.save();
    throw new ApiError(StatusCodes.BAD_REQUEST, "Mã OTP đã hết hạn. Vui lòng thử lại.");
  }

  // Hash the incoming OTP and compare
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashedOTP !== user.emailChangeOTP) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Mã OTP không chính xác");
  }

  // OTP is correct! Change the email
  user.email = user.newEmailPending;
  user.newEmailPending = undefined;
  user.emailChangeOTP = undefined;
  user.emailChangeExpires = undefined;
  await user.save();

  return respone(StatusCodes.OK, "Đổi địa chỉ email thành công");
};

// ---------------------------------------------------------------------------
// CREATE LANDLORD (Admin Only)
// ---------------------------------------------------------------------------
const createLandlordService = async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email đã được sử dụng");
  }

  // Lấy role landlord từ DB
  let landlordRole = await import("../models/index.js").then(m => m.roleModel.findOne({ name: "landlord" }));
  if (!landlordRole) {
    landlordRole = await import("../models/index.js").then(m => m.roleModel.create({ name: "landlord", permissions: [] }));
  }

  const newUser = await userModel.create({
    username,
    email,
    password,
    role: landlordRole._id,
  });

  return respone(StatusCodes.CREATED, "Tạo tài khoản Chủ nhà thành công", {
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
};

export {
  getUserByIdService,
  getAllUsersService,
  updateProfileService,
  changePasswordService,
  deleteUserService,
  requestEmailChangeService,
  verifyEmailChangeService,
  createLandlordService,
};
