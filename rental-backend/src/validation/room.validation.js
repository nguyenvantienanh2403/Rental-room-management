import Joi from "joi";

// Require a valid MongoDB ObjectId
const objectIdMessage = "Định dạng ObjectId không hợp lệ";

const createRoom = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Tên/Số phòng là bắt buộc",
  }),
  buildingId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "ID tòa nhà là bắt buộc",
      "string.pattern.base": objectIdMessage,
    }),
  price: Joi.number().positive().required().messages({
    "number.positive": "Giá phòng phải là số dương",
    "any.required": "Giá phòng là bắt buộc",
  }),
  area: Joi.number().positive().messages({
    "number.positive": "Diện tích phải là số dương",
  }),
  maxCapacity: Joi.number().integer().min(1).messages({
    "number.min": "Số người tối đa phải lớn hơn hoặc bằng 1",
    "number.base": "Số người tối đa phải là số",
  }),
  status: Joi.string().valid("available", "rented", "maintenance").default("available").messages({
    "any.only": "Trạng thái phòng phải là: available, rented, maintenance",
  }),
  amenities: Joi.array().items(Joi.string().trim()),
  images: Joi.array().items(Joi.string().trim()),
});

const updateRoom = Joi.object({
  name: Joi.string().trim(),
  price: Joi.number().positive().messages({
    "number.positive": "Giá phòng phải là số dương",
  }),
  area: Joi.number().positive().messages({
    "number.positive": "Diện tích phải là số dương",
  }),
  maxCapacity: Joi.number().integer().min(1).messages({
    "number.min": "Số người tối đa phải lớn hơn hoặc bằng 1",
    "number.base": "Số người tối đa phải là số",
  }),
  status: Joi.string().valid("available", "rented", "maintenance").messages({
    "any.only": "Trạng thái phòng phải là: available, rented, maintenance",
  }),
  amenities: Joi.array().items(Joi.string().trim()),
  images: Joi.array().items(Joi.string().trim()),
}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

export const roomValidation = {
  createRoom,
  updateRoom,
};
