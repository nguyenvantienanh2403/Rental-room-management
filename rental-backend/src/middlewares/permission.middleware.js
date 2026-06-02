import { StatusCodes } from "http-status-codes";
import { ApiError, catchAsync } from "../utils/index.js";

/**
 * Middleware to check if the authenticated user has the required permission.
 * Reads permissions from req.user.role.permissions (populated by auth middleware).
 *
 * @param {string} requiredPermission — The permission name to check (e.g. "admin")
 */
const checkPermission = (requiredPermission) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;

    if (!user || !user.role) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Bạn không có quyền thực hiện hành động này",
      );
    }

    // role.permissions is populated as an array of permission documents
    const userPermissions = (user.role.permissions || []).map(
      (p) => (typeof p === "object" ? p.name : p),
    );

    // Also check the role name itself (e.g. role.name === "Admin")
    const hasPermission =
      userPermissions.includes(requiredPermission) ||
      user.role.name?.toLowerCase() === requiredPermission.toLowerCase();

    if (!hasPermission) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Bạn không có quyền thực hiện hành động này",
      );
    }

    next();
  });
};

export default checkPermission;
