import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { notificationService } from "../services/index.js";

const getNotifications = catchAsync(async (req, res) => {
  const data = await notificationService.getNotificationsService(req.user._id, req.query);
  res.status(StatusCodes.OK).json(data);
});

const getUnreadCount = catchAsync(async (req, res) => {
  const data = await notificationService.getUnreadCountService(req.user._id);
  res.status(StatusCodes.OK).json(data);
});

const markAsRead = catchAsync(async (req, res) => {
  const data = await notificationService.markAsReadService(req.user._id, req.params.id);
  res.status(StatusCodes.OK).json(data);
});

const markAllAsRead = catchAsync(async (req, res) => {
  const data = await notificationService.markAllAsReadService(req.user._id);
  res.status(StatusCodes.OK).json(data);
});

export { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
