import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { userService } from "../services/index.js";

// ---------------------------------------------------------------------------
// GET /users/:id — Get a single user by ID
// ---------------------------------------------------------------------------
const getUserById = catchAsync(async (req, res) => {
  const data = await userService.getUserByIdService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// POST /users/landlord — Create a landlord (Admin)
// ---------------------------------------------------------------------------
const createLandlord = catchAsync(async (req, res) => {
  const data = await userService.createLandlordService(req.body);
  res.status(StatusCodes.CREATED).json(data);
});

// ---------------------------------------------------------------------------
// GET /users — Get all users (Admin)
// ---------------------------------------------------------------------------
const getAllUsers = catchAsync(async (req, res) => {
  const data = await userService.getAllUsersService(req.query);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /users/:id/profile — Update own profile
// ---------------------------------------------------------------------------
const updateProfile = catchAsync(async (req, res) => {
  const data = await userService.updateProfileService(
    req.user._id,   // authenticated user (from auth middleware)
    req.params.id,   // target user
    req.body,
  );
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// PATCH /users/:id/change-password — Change own password
// ---------------------------------------------------------------------------
const changePassword = catchAsync(async (req, res) => {
  const data = await userService.changePasswordService(
    req.user._id,
    req.params.id,
    req.body,
  );
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /users/:id — Soft delete (deactivate) a user
// ---------------------------------------------------------------------------
const deleteUser = catchAsync(async (req, res) => {
  const data = await userService.deleteUserService(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// POST /users/me/request-email-change
// ---------------------------------------------------------------------------
const requestEmailChange = catchAsync(async (req, res) => {
  const data = await userService.requestEmailChangeService(req.user._id, req.body);
  res.status(StatusCodes.OK).json(data);
});

// ---------------------------------------------------------------------------
// POST /users/me/verify-email-change
// ---------------------------------------------------------------------------
const verifyEmailChange = catchAsync(async (req, res) => {
  const data = await userService.verifyEmailChangeService(req.user._id, req.body);
  res.status(StatusCodes.OK).json(data);
});

export { getUserById, getAllUsers, updateProfile, changePassword, deleteUser, requestEmailChange, verifyEmailChange, createLandlord };
