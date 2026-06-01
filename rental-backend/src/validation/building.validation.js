import Joi from "joi";

// ---------------------------------------------------------------------------
// ADDRESS SUB-SCHEMA  (tái sử dụng trong create và update)
// ---------------------------------------------------------------------------
const addressSchema = Joi.object({
  street: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Street address is required",
    }),
  ward: Joi.string()
    .trim()
    .allow("")
    .default(""),
  district: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "District is required",
    }),
  city: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "City is required",
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
      "string.uri": "Image URL must be a valid URL",
      "any.required": "Image URL is required",
    }),
  publicId: Joi.string()
    .required()
    .messages({
      "any.required": "Image publicId is required",
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
      "string.min": "Building name must be at least 2 characters",
      "string.max": "Building name must not exceed 200 characters",
      "any.required": "Building name is required",
    }),

  type: Joi.string()
    .valid("apartment", "boarding_house", "dormitory", "studio", "other")
    .required()
    .messages({
      "any.only": "Type must be one of: apartment, boarding_house, dormitory, studio, other",
      "any.required": "Building type is required",
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .default("")
    .messages({
      "string.max": "Description must not exceed 2000 characters",
    }),

  address: addressSchema.required().messages({
    "any.required": "Address is required",
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
      "number.min": "Total rooms cannot be negative",
    }),

  contactPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .allow("")
    .default("")
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
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
      "string.min": "Building name must be at least 2 characters",
      "string.max": "Building name must not exceed 200 characters",
    }),

  type: Joi.string()
    .valid("apartment", "boarding_house", "dormitory", "studio", "other")
    .messages({
      "any.only": "Type must be one of: apartment, boarding_house, dormitory, studio, other",
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .messages({
      "string.max": "Description must not exceed 2000 characters",
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
      "number.min": "Total rooms cannot be negative",
    }),

  contactPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .allow("")
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
}).min(1).messages({
  "object.min": "At least one field must be provided to update",
});

export const buildingValidation = {
  createBuilding,
  updateBuilding,
};
