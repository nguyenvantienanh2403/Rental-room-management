import Joi from "joi";

// Require a valid MongoDB ObjectId
const objectIdMessage = "Invalid ObjectId format";

const createRoom = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Room name/number is required",
  }),
  buildingId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Building ID is required",
      "string.pattern.base": objectIdMessage,
    }),
  price: Joi.number().positive().required().messages({
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),
  area: Joi.number().positive().messages({
    "number.positive": "Area must be a positive number",
  }),
  status: Joi.string().valid("available", "rented", "maintenance").default("available").messages({
    "any.only": "Status must be one of: available, rented, maintenance",
  }),
  amenities: Joi.array().items(Joi.string().trim()),
  images: Joi.array().items(Joi.string().trim()),
});

const updateRoom = Joi.object({
  name: Joi.string().trim(),
  price: Joi.number().positive().messages({
    "number.positive": "Price must be a positive number",
  }),
  area: Joi.number().positive().messages({
    "number.positive": "Area must be a positive number",
  }),
  status: Joi.string().valid("available", "rented", "maintenance").messages({
    "any.only": "Status must be one of: available, rented, maintenance",
  }),
  amenities: Joi.array().items(Joi.string().trim()),
  images: Joi.array().items(Joi.string().trim()),
}).min(1).messages({
  "object.min": "At least one field must be provided to update",
});

export const roomValidation = {
  createRoom,
  updateRoom,
};
