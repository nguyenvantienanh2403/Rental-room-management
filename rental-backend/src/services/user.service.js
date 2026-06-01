import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { ApiError, respone } from "../utils/index.js";
import { userModel } from "../models/index.js";
import env from "../config/env.config.js";

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
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.status === "inactive") {
    throw new ApiError(StatusCodes.GONE, "This account has been deactivated");
  }

  return respone(StatusCodes.OK, "User retrieved successfully", user);
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

  return respone(StatusCodes.OK, "Users retrieved successfully", {
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
const updateProfileService = async (currentUserId, targetUserId, updateData) => {
  // Ensure users can only update their own profile
  if (currentUserId.toString() !== targetUserId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You can only update your own profile",
    );
  }

  // Whitelist of fields users are allowed to update
  const allowedFields = ["username", "email", "avatar"];
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No valid fields to update");
  }

  // Check for duplicate username if being updated
  if (sanitizedData.username) {
    const existingUsername = await userModel.findOne({
      username: sanitizedData.username,
      _id: { $ne: targetUserId },
    });
    if (existingUsername) {
      throw new ApiError(StatusCodes.CONFLICT, "Username already in use");
    }
  }

  // Check for duplicate email if being updated
  if (sanitizedData.email) {
    const existingEmail = await userModel.findOne({
      email: sanitizedData.email,
      _id: { $ne: targetUserId },
    });
    if (existingEmail) {
      throw new ApiError(StatusCodes.CONFLICT, "Email already in use");
    }
  }

  const updatedUser = await userModel
    .findByIdAndUpdate(targetUserId, { $set: sanitizedData }, { new: true, runValidators: true })
    .select(EXCLUDE_FIELDS)
    .populate(USER_POPULATE)
    .lean();

  if (!updatedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return respone(StatusCodes.OK, "Profile updated successfully", updatedUser);
};

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
const changePasswordService = async (currentUserId, targetUserId, passwordData) => {
  const { currentPassword, newPassword } = passwordData;

  // Ensure users can only change their own password
  if (currentUserId.toString() !== targetUserId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You can only change your own password",
    );
  }

  if (!currentPassword || !newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Current password and new password are required",
    );
  }

  if (newPassword.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password must be at least 6 characters long",
    );
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from current password",
    );
  }

  // Fetch user WITH password (we need it for comparison)
  const user = await userModel.findById(targetUserId).select("+password");
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Verify the current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Current password is incorrect");
  }

  // Hash and save the new password
  user.password = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await user.save();

  return respone(StatusCodes.OK, "Password changed successfully");
};

// ---------------------------------------------------------------------------
// DELETE USER  (Soft delete — sets status to "inactive")
// ---------------------------------------------------------------------------
const deleteUserService = async (userId) => {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.status === "inactive") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User is already deactivated");
  }

  user.status = "inactive";
  await user.save();

  return respone(StatusCodes.OK, "User deactivated successfully");
};

export {
  getUserByIdService,
  getAllUsersService,
  updateProfileService,
  changePasswordService,
  deleteUserService,
};
