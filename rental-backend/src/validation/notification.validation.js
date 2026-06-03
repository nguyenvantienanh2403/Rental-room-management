import Joi from "joi";

const objectIdMessage = "Định dạng ObjectId không hợp lệ";

const markAsRead = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "ID thông báo là bắt buộc",
      "string.pattern.base": objectIdMessage,
    }),
});

export const notificationValidation = {
  markAsRead,
};
