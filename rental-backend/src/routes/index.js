import { Router } from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import buildingRoute from "./building.route.js";
import roomRoute from "./room.route.js";
import tenantRoute from "./tenant.route.js";
import contractRoute from "./contract.route.js";
import invoiceRoute from "./invoice.route.js";
import meterReadingRoute from "./meterReading.route.js";
import dashboardRoute from "./dashboard.route.js";
import notificationRoute from "./notification.route.js";

export { authRoute, userRoute, buildingRoute, roomRoute, tenantRoute, contractRoute, invoiceRoute, meterReadingRoute, dashboardRoute, notificationRoute };

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/buildings", buildingRoute);
router.use("/rooms", roomRoute);
router.use("/tenants", tenantRoute);
router.use("/contracts", contractRoute);
router.use("/invoices", invoiceRoute);
router.use("/meter-readings", meterReadingRoute);
router.use("/dashboard", dashboardRoute);
router.use("/notifications", notificationRoute);

export default router;
