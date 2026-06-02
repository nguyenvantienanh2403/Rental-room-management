import Joi from "joi";

const objectIdMessage = "Định dạng ObjectId không hợp lệ";

const createTenant = Joi.object({
  fullName: Joi.string().trim().required().messages({
    "any.required": "Họ và tên là bắt buộc",
  }),
  identityCard: Joi.string()
    .trim()
    .pattern(/^[0-9]{9,12}$/)
    .required()
    .messages({
      "any.required": "Căn cước công dân là bắt buộc",
      "string.pattern.base": "Căn cước công dân phải từ 9 đến 12 số",
    }),
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .required()
    .messages({
      "any.required": "Số điện thoại là bắt buộc",
      "string.pattern.base": "Vui lòng cung cấp số điện thoại hợp lệ",
    }),
  email: Joi.string().email().allow("").messages({
    "string.email": "Vui lòng cung cấp địa chỉ email hợp lệ",
  }),
  homeTown: Joi.string().trim().required().messages({
    "any.required": "Quê quán là bắt buộc",
  }),
  roomId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "ID phòng là bắt buộc",
      "string.pattern.base": objectIdMessage,
    }),
  status: Joi.string().valid("active", "moved_out").default("active").messages({
    "any.only": "Trạng thái phải là: active, moved_out",
  }),
});

const updateTenant = Joi.object({
  fullName: Joi.string().trim(),
  identityCard: Joi.string()
    .trim()
    .pattern(/^[0-9]{9,12}$/)
    .messages({
      "string.pattern.base": "Căn cước công dân phải từ 9 đến 12 số",
    }),
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .messages({
      "string.pattern.base": "Vui lòng cung cấp số điện thoại hợp lệ",
    }),
  email: Joi.string().email().allow("").messages({
    "string.email": "Vui lòng cung cấp địa chỉ email hợp lệ",
  }),
  homeTown: Joi.string().trim(),
  roomId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": objectIdMessage,
    }),
  status: Joi.string().valid("active", "moved_out").messages({
    "any.only": "Trạng thái phải là: active, moved_out",
  }),
}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

export const tenantValidation = {
  createTenant,
  updateTenant,
};
