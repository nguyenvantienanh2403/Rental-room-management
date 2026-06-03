import express from "express";
import { notificationController } from "../controllers/index.js";
import validate from "../middlewares/validate.middleware.js";
import { notificationValidation } from "../validation/index.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", validate(notificationValidation.markAsRead), notificationController.markAsRead);

export default router;
