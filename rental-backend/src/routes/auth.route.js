import express from "express";
import { authController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { userValidation } from "../validation/index.js";

const authRoute = express.Router();

authRoute.post("/register", validate(userValidation.register), authController.register);
authRoute.post("/login", validate(userValidation.login), authController.login);
authRoute.post("/refresh-token", authController.refreshToken);
authRoute.post("/logout", authController.logout);
authRoute.get("/me", auth, authController.getMe);
authRoute.post("/forgot-password", validate(userValidation.forgotPassword), authController.forgotPassword);
authRoute.put("/reset-password/:token", validate(userValidation.resetPassword), authController.resetPassword);

export default authRoute;
