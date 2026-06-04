import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import { roleModel } from "../models/index.js";
import Permission from "../models/permission.model.js";
import { PERMISSIONS, ROLES } from "../constants/index.js";

// Đọc env cho trường hợp chạy độc lập
dotenv.config();

const seedRoles = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Seeding Roles...");

    // 1. Tạo tất cả Permissions từ file Constant
    const permissionNames = Object.values(PERMISSIONS);
    const permissionDocs = [];

    for (const name of permissionNames) {
      let perm = await Permission.findOne({ name });
      if (!perm) {
        perm = await Permission.create({ name });
        console.log(`Created Permission: ${name}`);
      }
      permissionDocs.push(perm);
    }

    console.log("--- Permissions seeded successfully ---");

    // Lấy ID của các Permissions để gán cho Role
    const getPermIds = (names) => 
      permissionDocs.filter(p => names.includes(p.name)).map(p => p._id);

    // 2. Định nghĩa các Roles và Permissions tương ứng
    const rolesConfig = [
      {
        name: ROLES.ADMIN, // admin
        permissions: getPermIds(Object.values(PERMISSIONS)) // Admin có TẤT CẢ quyền
      },
      {
        name: ROLES.LANDLORD, // landlord
        permissions: getPermIds([
          PERMISSIONS.MANAGE_BUILDINGS,
          PERMISSIONS.MANAGE_ROOMS,
          PERMISSIONS.MANAGE_TENANTS,
          PERMISSIONS.MANAGE_INVOICES,
          PERMISSIONS.VIEW_OWN_INFO
        ]) // Landlord có quyền quản lý thực thể
      },
      {
        name: ROLES.USER, // user
        permissions: getPermIds([
          PERMISSIONS.VIEW_OWN_INFO
        ]) // User bình thường
      }
    ];

    // 3. Cập nhật hoặc tạo Roles
    for (const roleData of rolesConfig) {
      const existingRole = await roleModel.findOne({ name: roleData.name });
      if (!existingRole) {
        await roleModel.create(roleData);
        console.log(`Created Role: ${roleData.name}`);
      } else {
        // Cập nhật lại danh sách permissions cho Role hiện tại (phòng trường hợp Role cũ bị thiếu quyền)
        existingRole.permissions = roleData.permissions;
        await existingRole.save();
        console.log(`Updated permissions for Role: ${roleData.name}`);
      }
    }

    console.log("--- Roles seeded successfully ---");
    process.exit(0);
  } catch (error) {
    console.error("Role seeding failed:", error.message);
    process.exit(1);
  }
};

seedRoles();
