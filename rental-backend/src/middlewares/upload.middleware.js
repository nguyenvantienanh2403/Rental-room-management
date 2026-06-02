import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/index.js";

// ---------------------------------------------------------------------------
// Storage — sử dụng memoryStorage, file nằm trong req.file.buffer
// ---------------------------------------------------------------------------
const storage = multer.memoryStorage();

// ---------------------------------------------------------------------------
// File filter — chỉ chấp nhận image/jpeg, image/png, image/webp
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        `Định dạng file "${file.mimetype}" không hợp lệ. Chỉ chấp nhận JPEG, PNG và WebP`,
      ),
      false,
    );
  }
};

// ---------------------------------------------------------------------------
// Base multer instance — 5MB limit
// ---------------------------------------------------------------------------
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ---------------------------------------------------------------------------
// Wrapper — bắt lỗi Multer và chuyển thành ApiError
// ---------------------------------------------------------------------------
const handleMulterError = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new ApiError(
                StatusCodes.BAD_REQUEST,
                `File quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
              ),
            );
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return next(
              new ApiError(
                StatusCodes.BAD_REQUEST,
                `Trường dữ liệu không hợp lệ "${err.field}"`,
              ),
            );
          }
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, err.message),
          );
        }
        // ApiError từ fileFilter hoặc lỗi khác
        return next(err);
      }
      next();
    });
  };
};

// ---------------------------------------------------------------------------
// Exported middlewares
// ---------------------------------------------------------------------------

/** Upload 1 ảnh avatar — field name: "avatar" */
const uploadAvatar = handleMulterError(upload.single("avatar"));

/** Upload 1 ảnh generic — field name: "image" */
const uploadSingleImage = handleMulterError(upload.single("image"));

/** Upload nhiều ảnh — field name: "images", tối đa 10 ảnh */
const uploadMultipleImages = handleMulterError(upload.array("images", 10));

export { uploadAvatar, uploadSingleImage, uploadMultipleImages };
