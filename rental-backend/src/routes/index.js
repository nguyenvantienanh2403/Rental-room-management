import { Router } from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import buildingRoute from "./building.route.js";
import roomRoute from "./room.route.js";

export { authRoute, userRoute, buildingRoute, roomRoute };

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/buildings", buildingRoute);
router.use("/rooms", roomRoute);

export default router;
