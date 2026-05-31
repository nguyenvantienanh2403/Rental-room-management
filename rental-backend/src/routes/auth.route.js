import express from "express";
import { authController } from "../controllers/index.js";
import auth from "../middlewares/auth.middleware.js";
const authRoute = express.Router();

authRoute.post("/register", authController.register);
authRoute.post("/login", authController.login);
authRoute.post("/refresh-token", authController.refreshToken);
authRoute.post("/logout", authController.logout);
authRoute.get("/me", auth, authController.getMe);

export default authRoute;
