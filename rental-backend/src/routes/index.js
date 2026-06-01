import { Router } from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import buildingRoute from "./building.route.js";

export { authRoute, userRoute, buildingRoute };

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/buildings", buildingRoute);

export default router;
