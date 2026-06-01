import Joi from "joi";

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
const register = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
      "any.required": "Username is required",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must not exceed 128 characters",
      "any.required": "Password is required",
    }),
});

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
const login = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .required()
    .messages({
      "any.required": "Password is required",
    }),
});

// ---------------------------------------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------------------------------------
const updateProfile = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .messages({
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 30 characters",
    }),

  email: Joi.string()
    .email()
    .messages({
      "string.email": "Please provide a valid email address",
    }),

  avatar: Joi.string()
    .uri()
    .messages({
      "string.uri": "Avatar must be a valid URL",
    }),
}).min(1).messages({
  "object.min": "At least one field must be provided to update",
});

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
const changePassword = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      "any.required": "Current password is required",
    }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .disallow(Joi.ref("currentPassword"))
    .messages({
      "string.min": "New password must be at least 6 characters",
      "string.max": "New password must not exceed 128 characters",
      "any.required": "New password is required",
      "any.invalid": "New password must be different from current password",
    }),
});

export const userValidation = {
  register,
  login,
  updateProfile,
  changePassword,
};
