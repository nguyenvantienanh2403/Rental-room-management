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
      "string.min": "Tên đăng nhập phải có ít nhất 3 ký tự",
      "string.max": "Tên đăng nhập không được vượt quá 30 ký tự",
      "any.required": "Tên đăng nhập là bắt buộc",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Vui lòng cung cấp địa chỉ email hợp lệ",
      "any.required": "Email là bắt buộc",
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
      "string.max": "Mật khẩu không được vượt quá 128 ký tự",
      "any.required": "Mật khẩu là bắt buộc",
    }),

  fullName: Joi.string()
    .required()
    .messages({
      "any.required": "Họ và tên là bắt buộc",
      "string.empty": "Họ và tên không được để trống",
    }),

  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .required()
    .messages({
      "any.required": "Số điện thoại là bắt buộc",
      "string.empty": "Số điện thoại không được để trống",
      "string.pattern.base": "Vui lòng cung cấp số điện thoại hợp lệ",
    }),

  identityCard: Joi.string()
    .trim()
    .pattern(/^[0-9]{9,12}$/)
    .required()
    .messages({
      "any.required": "CCCD/CMND là bắt buộc",
      "string.empty": "CCCD/CMND không được để trống",
      "string.pattern.base": "Căn cước công dân phải từ 9 đến 12 số",
    }),

  homeTown: Joi.string()
    .required()
    .messages({
      "any.required": "Quê quán là bắt buộc",
      "string.empty": "Quê quán không được để trống",
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
      "string.email": "Vui lòng cung cấp địa chỉ email hợp lệ",
      "any.required": "Email là bắt buộc",
    }),

  password: Joi.string()
    .required()
    .messages({
      "any.required": "Mật khẩu là bắt buộc",
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
      "string.min": "Tên đăng nhập phải có ít nhất 3 ký tự",
      "string.max": "Tên đăng nhập không được vượt quá 30 ký tự",
    }),

  email: Joi.string()
    .email()
    .messages({
      "string.email": "Vui lòng cung cấp địa chỉ email hợp lệ",
    }),

  avatar: Joi.string()
    .uri()
    .messages({
      "string.uri": "Avatar phải là một URL hợp lệ",
    }),

  fullName: Joi.string().allow(""),
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .allow("")
    .messages({
      "string.pattern.base": "Vui lòng cung cấp số điện thoại hợp lệ",
    }),
  identityCard: Joi.string()
    .trim()
    .pattern(/^[0-9]{9,12}$/)
    .allow("")
    .messages({
      "string.pattern.base": "Căn cước công dân phải từ 9 đến 12 số",
    }),
  homeTown: Joi.string().allow(""),
  bankInfo: Joi.object({
    bankId: Joi.string().allow(""),
    accountNumber: Joi.string().allow(""),
    accountName: Joi.string().allow("")
  }).optional()

}).min(1).messages({
  "object.min": "Phải cung cấp ít nhất một trường để cập nhật",
});

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
const changePassword = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      "any.required": "Mật khẩu hiện tại là bắt buộc",
    }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .disallow(Joi.ref("currentPassword"))
    .messages({
      "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
      "string.max": "Mật khẩu mới không được vượt quá 128 ký tự",
      "any.required": "Mật khẩu mới là bắt buộc",
      "any.invalid": "Mật khẩu mới phải khác với mật khẩu hiện tại",
    }),
});

// ---------------------------------------------------------------------------
// FORGOT PASSWORD
// ---------------------------------------------------------------------------
const forgotPassword = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Vui lòng cung cấp địa chỉ email hợp lệ",
      "any.required": "Email là bắt buộc",
    }),
});

// ---------------------------------------------------------------------------
// RESET PASSWORD
// ---------------------------------------------------------------------------
const resetPassword = Joi.object({
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
      "string.max": "Mật khẩu mới không được vượt quá 128 ký tự",
      "any.required": "Mật khẩu mới là bắt buộc",
    }),
});

export const userValidation = {
  register,
  login,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
