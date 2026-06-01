import { StatusCodes } from "http-status-codes";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.config.js";
import { ApiError, respone } from "../utils/index.js";
import { userModel } from "../models/index.js";

// ---------------------------------------------------------------------------
// UPLOAD TO CLOUDINARY  (reusable cho avatar, property, review, amenity...)
// ---------------------------------------------------------------------------

/**
 * Upload buffer lên Cloudinary bằng upload_stream.
 *
 * @param {Buffer}  buffer  — file buffer từ multer memoryStorage
 * @param {string}  folder  — folder trên Cloudinary (vd: "rental-app/avatars")
 * @param {object}  [options] — tuỳ chọn thêm cho Cloudinary (transformation, etc.)
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: "image",
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(
              StatusCodes.INTERNAL_SERVER_ERROR,
              `Cloudinary upload failed: ${error.message}`,
            ),
          );
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    // Pipe buffer vào upload stream
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ---------------------------------------------------------------------------
// DELETE FROM CLOUDINARY
// ---------------------------------------------------------------------------

/**
 * Xóa ảnh trên Cloudinary theo public_id.
 *
 * @param {string} publicId — public_id của ảnh cần xóa
 * @returns {Promise<object>} — kết quả từ Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    // Log nhưng không throw — xóa ảnh cũ thất bại không nên block flow chính
    console.error(`Failed to delete image from Cloudinary: ${publicId}`, error);
  }
};

// ---------------------------------------------------------------------------
// EXTRACT PUBLIC ID FROM CLOUDINARY URL
// ---------------------------------------------------------------------------

/**
 * Trích xuất public_id từ Cloudinary URL.
 *
 * Ví dụ:
 *   Input:  "https://res.cloudinary.com/demo/image/upload/v1234567890/rental-app/avatars/abc123.jpg"
 *   Output: "rental-app/avatars/abc123"
 *
 * @param {string} url — Cloudinary secure_url
 * @returns {string|null} — public_id hoặc null nếu không parse được
 */
const extractPublicId = (url) => {
  if (!url) return null;

  try {
    // URL format: .../upload/v{version}/{public_id}.{ext}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// UPLOAD AVATAR SERVICE
// ---------------------------------------------------------------------------

/**
 * Upload avatar cho user:
 * 1. Validate file tồn tại
 * 2. Upload lên Cloudinary (folder: rental-app/avatars)
 * 3. Xóa avatar cũ trên Cloudinary (nếu có)
 * 4. Cập nhật user.avatar = secure_url
 * 5. Trả về user đã cập nhật
 *
 * @param {string} userId — ID của user (từ req.user._id)
 * @param {object} file   — req.file từ Multer
 */
const uploadAvatarService = async (userId, file) => {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No image file provided");
  }

  // 1. Lấy user hiện tại
  const user = await userModel.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2. Upload ảnh mới lên Cloudinary
  const { secure_url, public_id } = await uploadToCloudinary(
    file.buffer,
    "rental-app/avatars",
    {
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    },
  );

  // 3. Xóa avatar cũ trên Cloudinary (nếu có)
  const oldPublicId = extractPublicId(user.avatar);
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }

  // 4. Cập nhật avatar mới vào database
  user.avatar = secure_url;
  await user.save();

  // 5. Trả về response (populate role + permissions)
  const updatedUser = await userModel
    .findById(userId)
    .select("-password")
    .populate({
      path: "role",
      populate: { path: "permissions" },
    })
    .lean();

  return respone(StatusCodes.OK, "Avatar uploaded successfully", {
    avatar: secure_url,
    public_id,
    user: updatedUser,
  });
};

export {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  uploadAvatarService,
};
