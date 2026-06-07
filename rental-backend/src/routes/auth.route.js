import express from "express";
import { rateLimit } from "express-rate-limit";
import { authController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { userValidation } from "../validation/index.js";

const authRoute = express.Router();

// 4. Strict rate limit for authentication endpoints — 10 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
  },
});

authRoute.post(
  "/register",
  validate(userValidation.register), authLimiter,
  authController.register,
);
authRoute.post("/login", validate(userValidation.login), authLimiter, authController.login);
authRoute.post("/refresh-token", authController.refreshToken);
authRoute.post("/logout", authController.logout);
authRoute.get("/me", auth, authController.getMe);
authRoute.post(
  "/forgot-password",
  validate(userValidation.forgotPassword),
  authLimiter,
  authController.forgotPassword,
);
authRoute.put(
  "/reset-password/:token",
  validate(userValidation.resetPassword),
  authController.resetPassword,
);

export default authRoute;
