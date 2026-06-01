import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../utils/index.js";
import { uploadService } from "../services/index.js";

// ---------------------------------------------------------------------------
// PATCH /users/avatar — Upload avatar cho user đang đăng nhập
// ---------------------------------------------------------------------------
const uploadAvatar = catchAsync(async (req, res) => {
  const data = await uploadService.uploadAvatarService(req.user._id, req.file);
  res.status(StatusCodes.OK).json(data);
});

export { uploadAvatar };
