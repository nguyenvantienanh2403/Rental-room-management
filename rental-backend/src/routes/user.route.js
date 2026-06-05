import express from "express";
import { userController, uploadController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import checkPermission from "../middlewares/permission.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { userValidation } from "../validation/index.js";

const userRoute = express.Router();

// All user routes require authentication
userRoute.use(auth);

// GET /users — Admin only: list all users
userRoute.get("/", checkPermission("admin"), userController.getAllUsers);

// POST /users/landlord — Admin only: create a landlord
userRoute.post("/landlord", checkPermission("admin"), userController.createLandlord);

// PATCH /users/avatar — Upload avatar (self only, dùng req.user._id)
// ⚠️ Route này phải đặt TRƯỚC /:id để tránh "avatar" bị match như ObjectId
userRoute.patch("/avatar", uploadAvatar, uploadController.uploadAvatar);

// POST /users/me/request-email-change
userRoute.post("/me/request-email-change", userController.requestEmailChange);

// POST /users/me/verify-email-change
userRoute.post("/me/verify-email-change", userController.verifyEmailChange);

// GET /users/:id — Get user by ID (any authenticated user)
userRoute.get("/:id", userController.getUserById);

// PATCH /users/:id/profile — Update own profile
userRoute.patch(
  "/:id/profile",
  validate(userValidation.updateProfile),
  userController.updateProfile,
);

// PATCH /users/:id/change-password — Change own password
userRoute.patch(
  "/:id/change-password",
  validate(userValidation.changePassword),
  userController.changePassword,
);

// DELETE /users/:id — Admin only: soft delete a user
userRoute.delete("/:id", checkPermission("admin"), userController.deleteUser);

export default userRoute;
