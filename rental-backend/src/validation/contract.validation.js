import Joi from "joi";

const objectIdMessage = "Định dạng ObjectId không hợp lệ";

const createContract = Joi.object({

  roomId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "ID phòng là bắt buộc",
      "string.pattern.base": objectIdMessage,
    }),
  tenantId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "ID khách thuê là bắt buộc",
      "string.pattern.base": objectIdMessage,
    }),
  startDate: Joi.date().iso().required().messages({
    "any.required": "Ngày bắt đầu là bắt buộc",
    "date.format": "Ngày bắt đầu không hợp lệ",
  }),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required().messages({
    "any.required": "Ngày kết thúc là bắt buộc",
    "date.greater": "Ngày kết thúc phải sau ngày bắt đầu",
    "date.format": "Ngày kết thúc không hợp lệ",
  }),
  deposit: Joi.number().min(0).required().messages({
    "number.min": "Tiền cọc không được là số âm",
    "any.required": "Tiền cọc là bắt buộc",
  }),
  monthlyPrice: Joi.number().positive().required().messages({
    "number.positive": "Giá thuê hàng tháng phải là số dương",
    "any.required": "Giá thuê hàng tháng là bắt buộc",
  }),
  electricityPrice: Joi.number().min(0).required().messages({
    "number.min": "Giá điện không được là số âm",
    "any.required": "Giá điện là bắt buộc",
  }),
  waterPrice: Joi.number().min(0).required().messages({
    "number.min": "Giá nước không được là số âm",
    "any.required": "Giá nước là bắt buộc",
  }),
  status: Joi.string().valid("active", "expired", "terminated").default("active").messages({
    "any.only": "Trạng thái hợp đồng phải là: active, expired, terminated",
  }),
});

const updateContract = Joi.object({
  contractCode: Joi.string().trim(),
  roomId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": objectIdMessage,
    }),
  tenantId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": objectIdMessage,
    }),
  startDate: Joi.date().iso().messages({
    "date.format": "Ngày bắt đầu không hợp lệ",
  }),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).messages({
    "date.greater": "Ngày kết thúc phải sau ngày bắt đầu",
    "date.format": "Ngày kết thúc không hợp lệ",
  }),
  deposit: Joi.number().min(0).messages({
    "number.min": "Tiền cọc không được là số âm",
  }),
  monthlyPrice: Joi.number().positive().messages({
    "number.positive": "Giá thuê hàng tháng phải là số dương",
  }),
  electricityPrice: Joi.number().min(0).messages({
    "number.min": "Giá điện không được là số âm",
  }),
  waterPrice: Joi.number().min(0).messages({
    "number.min": "Giá nước không được là số âm",
  }),
  status: Joi.string().valid("active", "expired", "terminated").messages({
    "any.only": "Trạng thái hợp đồng phải là: active, expired, terminated",
  }),
}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

export const contractValidation = {
  createContract,
  updateContract,
};
