import Joi from "joi";

// ---------------------------------------------------------------------------
// ADDRESS SUB-SCHEMA  (tái sử dụng trong create và update)
// ---------------------------------------------------------------------------
const addressSchema = Joi.object({
  street: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Tên đường là bắt buộc",
    }),
  ward: Joi.string()
    .trim()
    .allow("")
    .default(""),
  district: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Quận/Huyện là bắt buộc",
    }),
  city: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Thành phố là bắt buộc",
    }),
});

// ---------------------------------------------------------------------------
// IMAGE SUB-SCHEMA
// ---------------------------------------------------------------------------
const imageSchema = Joi.object({
  url: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "URL hình ảnh không hợp lệ",
      "any.required": "URL hình ảnh là bắt buộc",
    }),
  publicId: Joi.string()
    .required()
    .messages({
      "any.required": "Image publicId là bắt buộc",
    }),
});

// ---------------------------------------------------------------------------
// CREATE BUILDING
// ---------------------------------------------------------------------------
const createBuilding = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      "string.min": "Tên tòa nhà phải có ít nhất 2 ký tự",
      "string.max": "Tên tòa nhà không được vượt quá 200 ký tự",
      "any.required": "Tên tòa nhà là bắt buộc",
    }),

  type: Joi.string()
    .valid("apartment", "boarding_house", "dormitory", "studio", "other")
    .required()
    .messages({
      "any.only": "Loại tòa nhà phải là: apartment, boarding_house, dormitory, studio, other",
      "any.required": "Loại tòa nhà là bắt buộc",
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .default("")
    .messages({
      "string.max": "Mô tả không được vượt quá 2000 ký tự",
    }),

  address: addressSchema.required().messages({
    "any.required": "Địa chỉ là bắt buộc",
  }),

  amenities: Joi.array()
    .items(Joi.string().trim())
    .default([]),

  images: Joi.array()
    .items(imageSchema)
    .default([]),

  totalRooms: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      "number.min": "Tổng số phòng không được là số âm",
    }),

  contactPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .allow("")
    .default("")
    .messages({
      "string.pattern.base": "Vui lòng cung cấp số điện thoại hợp lệ",
    }),
});

// ---------------------------------------------------------------------------
// UPDATE BUILDING  (tất cả field đều optional, nhưng ít nhất 1 field)
// ---------------------------------------------------------------------------
const updateBuilding = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .messages({
      "string.min": "Tên tòa nhà phải có ít nhất 2 ký tự",
      "string.max": "Tên tòa nhà không được vượt quá 200 ký tự",
    }),

  type: Joi.string()
    .valid("apartment", "boarding_house", "dormitory", "studio", "other")
    .messages({
      "any.only": "Loại tòa nhà phải là: apartment, boarding_house, dormitory, studio, other",
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .messages({
      "string.max": "Mô tả không được vượt quá 2000 ký tự",
    }),

  address: addressSchema,

  amenities: Joi.array()
    .items(Joi.string().trim()),

  images: Joi.array()
    .items(imageSchema),

  totalRooms: Joi.number()
    .integer()
    .min(0)
    .messages({
      "number.min": "Tổng số phòng không được là số âm",
    }),

  contactPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .allow("")
    .messages({
      "string.pattern.base": "Vui lòng cung cấp số điện thoại hợp lệ",
    }),
}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

export const buildingValidation = {
  createBuilding,
  updateBuilding,
};
