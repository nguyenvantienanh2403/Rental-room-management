import { ROLES } from "../constants/index.js";

export const checkIsAdmin = (user) => {
  if (!user || !user.role) return false;
  const roleName = typeof user.role === 'object' ? user.role.name : user.role;
  return roleName?.toLowerCase() === ROLES.ADMIN;
};
