import { Router } from "express";
import authRoute from "./auth.route.js";

export { authRoute };

const router = Router();

router.use("/auth", authRoute);
export default router;
