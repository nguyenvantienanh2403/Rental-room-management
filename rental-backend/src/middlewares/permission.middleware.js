import { statusCodes } from "http-status-code";
import { ApiError, catchAsync } from "../utils/index.js";

const checkPermission = (requiredPermissions) => {
  return catchAsync(async (req, res, next) => {
    const userPermissions = req.permissions || [];

    if (!userPermissions.includes(requiredPermissions)) {
      throw new ApiError(
        statusCodes.FORBIDDEN,
        "You do not have permission to perform this action",
      );
    }
    next();
  });
};
export default checkPermission;
