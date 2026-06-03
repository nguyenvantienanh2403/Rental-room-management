import { StatusCodes } from "http-status-codes";
import { ApiError, respone } from "../utils/index.js";
import { notificationModel } from "../models/index.js";

// ---------------------------------------------------------------------------
// CREATE NOTIFICATION (INTERNAL)
// ---------------------------------------------------------------------------
const createNotificationService = async (data) => {
  const notification = await notificationModel.create(data);
  return notification;
};

// ---------------------------------------------------------------------------
// GET NOTIFICATIONS WITH PAGINATION
// ---------------------------------------------------------------------------
const getNotificationsService = async (recipientId, query = {}) => {
  const { page = 1, limit = 10, isRead } = query;
  
  const filter = { recipientId };
  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const [notifications, totalCount] = await Promise.all([
    notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    notificationModel.countDocuments(filter),
  ]);

  return respone(StatusCodes.OK, "Lấy danh sách thông báo thành công", {
    notifications,
    pagination: {
      page: parseInt(page, 10),
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
};

// ---------------------------------------------------------------------------
// GET UNREAD COUNT
// ---------------------------------------------------------------------------
const getUnreadCountService = async (recipientId) => {
  const count = await notificationModel.countDocuments({ recipientId, isRead: false });
  return respone(StatusCodes.OK, "Lấy số lượng thông báo chưa đọc thành công", { count });
};

// ---------------------------------------------------------------------------
// MARK AS READ (SINGLE)
// ---------------------------------------------------------------------------
const markAsReadService = async (recipientId, notificationId) => {
  const notification = await notificationModel.findOneAndUpdate(
    { _id: notificationId, recipientId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy thông báo hoặc bạn không có quyền");
  }

  return respone(StatusCodes.OK, "Đánh dấu đã đọc thành công", notification);
};

// ---------------------------------------------------------------------------
// MARK ALL AS READ
// ---------------------------------------------------------------------------
const markAllAsReadService = async (recipientId) => {
  await notificationModel.updateMany(
    { recipientId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return respone(StatusCodes.OK, "Đánh dấu đọc tất cả thành công");
};

export {
  createNotificationService,
  getNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
};
