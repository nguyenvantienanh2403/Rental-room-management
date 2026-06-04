const PERMISSIONS = {
  // Quản lý hệ thống toàn cục (Dành cho Admin)
  MANAGE_SYSTEM_USERS: "manage_system_users",

  // Quản lý dữ liệu thực thể (Dành cho Admin và Landlord)
  MANAGE_BUILDINGS: "manage_buildings",
  MANAGE_ROOMS: "manage_rooms",
  MANAGE_TENANTS: "manage_tenants",
  MANAGE_INVOICES: "manage_invoices",
  // Quyền cơ bản (Dành cho tất cả User, Landlord, Admin)
  VIEW_OWN_INFO: "view_own_info",
};
export default PERMISSIONS;
