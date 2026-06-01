import Joi from "joi";

const objectIdMessage = "Invalid ObjectId format";

const createTenant = Joi.object({
  fullName: Joi.string().trim().required().messages({
    "any.required": "Full name is required",
  }),
  identityCard: Joi.string()
    .trim()
    .pattern(/^[0-9]{9,12}$/)
    .required()
    .messages({
      "any.required": "Identity card is required",
      "string.pattern.base": "Identity card must be between 9 and 12 digits",
    }),
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .required()
    .messages({
      "any.required": "Phone number is required",
      "string.pattern.base": "Please provide a valid phone number",
    }),
  email: Joi.string().email().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  homeTown: Joi.string().trim().required().messages({
    "any.required": "Hometown is required",
  }),
  roomId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Room ID is required",
      "string.pattern.base": objectIdMessage,
    }),
  status: Joi.string().valid("active", "moved_out").default("active").messages({
    "any.only": "Status must be one of: active, moved_out",
  }),
});

const updateTenant = Joi.object({
  fullName: Joi.string().trim(),
  identityCard: Joi.string()
    .trim()
    .pattern(/^[0-9]{9,12}$/)
    .messages({
      "string.pattern.base": "Identity card must be between 9 and 12 digits",
    }),
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
  email: Joi.string().email().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  homeTown: Joi.string().trim(),
  roomId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": objectIdMessage,
    }),
  status: Joi.string().valid("active", "moved_out").messages({
    "any.only": "Status must be one of: active, moved_out",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided to update",
});

export const tenantValidation = {
  createTenant,
  updateTenant,
};
