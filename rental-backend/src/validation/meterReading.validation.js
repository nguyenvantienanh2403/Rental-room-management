import Joi from "joi";

const objectIdMessage = "Định dạng ObjectId không hợp lệ";

const createMeterReading = Joi.object({
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
  electricity: Joi.object({
    newIndex: Joi.number().min(0).required().messages({
      "number.min": "Chỉ số điện mới không được là số âm",
      "any.required": "Chỉ số điện mới là bắt buộc",
    }),
    isMeterReplaced: Joi.boolean().default(false),
  }).required().messages({
    "any.required": "Thông tin điện là bắt buộc",
  }),
  water: Joi.object({
    newIndex: Joi.number().min(0).messages({
      "number.min": "Chỉ số nước mới không được là số âm",
    }),
    isMeterReplaced: Joi.boolean().default(false),
  }).optional(),
});

const updateMeterReading = Joi.object({
  electricity: Joi.object({
    newIndex: Joi.number().min(0).messages({
      "number.min": "Chỉ số điện mới không được là số âm",
    }),
    isMeterReplaced: Joi.boolean(),
  }),
  water: Joi.object({
    newIndex: Joi.number().min(0).messages({
      "number.min": "Chỉ số nước mới không được là số âm",
    }),
    isMeterReplaced: Joi.boolean(),
  }),
}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

export const meterReadingValidation = {
  createMeterReading,
  updateMeterReading,
};
