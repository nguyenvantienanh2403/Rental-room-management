import Joi from "joi";

const objectIdMessage = "Định dạng ObjectId không hợp lệ";

const createInvoice = Joi.object({
  contractId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "ID hợp đồng là bắt buộc",
      "string.pattern.base": objectIdMessage,
    }),
  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.min": "Tháng không hợp lệ (1-12)",
    "number.max": "Tháng không hợp lệ (1-12)",
    "any.required": "Tháng là bắt buộc",
  }),
  year: Joi.number().integer().min(2000).required().messages({
    "number.min": "Năm không hợp lệ",
    "any.required": "Năm là bắt buộc",
  }),
  oldElectricityIndex: Joi.number().min(0).optional().messages({
    "number.min": "Chỉ số điện cũ không được là số âm",
  }),
  oldWaterIndex: Joi.number().min(0).optional().messages({
    "number.min": "Chỉ số nước cũ không được là số âm",
  }),
  newElectricityIndex: Joi.number().min(0).required().messages({
    "number.min": "Chỉ số điện mới không được là số âm",
    "any.required": "Chỉ số điện mới là bắt buộc",
  }),
  newWaterIndex: Joi.number().min(0).required().messages({
    "number.min": "Chỉ số nước mới không được là số âm",
    "any.required": "Chỉ số nước mới là bắt buộc",
  }),
  otherFees: Joi.number().min(0).messages({
    "number.min": "Phụ phí không được là số âm",
  }),
});

const updateInvoice = Joi.object({
  newElectricityIndex: Joi.number().min(0).messages({
    "number.min": "Chỉ số điện mới không được là số âm",
  }),
  newWaterIndex: Joi.number().min(0).messages({
    "number.min": "Chỉ số nước mới không được là số âm",
  }),
  otherFees: Joi.number().min(0).messages({
    "number.min": "Phụ phí không được là số âm",
  }),
}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

const updateStatus = Joi.object({
  status: Joi.string().valid("issued", "paid", "cancelled").required().messages({
    "any.only": "Trạng thái hợp lệ: issued, paid, cancelled",
    "any.required": "Trạng thái là bắt buộc",
  }),
});

export const invoiceValidation = {
  createInvoice,
  updateInvoice,
  updateStatus,
};
