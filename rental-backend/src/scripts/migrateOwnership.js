import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import { userModel } from "../models/index.js";
import Building from "../models/building.model.js";
import Room from "../models/room.model.js";
import { ROLES } from "../constants/index.js";

dotenv.config();

const migrateOwnership = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Migration...");

    // 1. Tìm tài khoản Admin đầu tiên trong hệ thống
    // Chú ý: Dựa vào role name "Admin" hoặc hằng số ROLES.ADMIN
    // Ta tìm Admin bằng cách join bảng Role
    const adminUser = await userModel.findOne().populate({
      path: "role",
      match: { name: { $in: ["Admin", ROLES.ADMIN] } }
    }).lean();

    const actualAdmins = await userModel.find().populate("role").lean();
    const admin = actualAdmins.find(u => u.role?.name?.toLowerCase() === 'admin');

    if (!admin) {
      console.error("Migration failed: Không tìm thấy tài khoản Admin nào trong hệ thống.");
      process.exit(1);
    }

    const adminId = admin._id;
    console.log(`Found Admin account: ${admin.username} (ID: ${adminId})`);

    // 2. Tìm tất cả các Buildings không có landlordId hoặc landlordId null
    // Hoặc cẩn thận hơn, ta gán đè landlordId cho TẤT CẢ buildings cũ (Vì trước đây làm gì có landlord)
    const buildingsToUpdate = await Building.find({ landlordId: { $exists: false } });
    
    // Nếu db thiết kế landlordId là required ngay từ đầu, có thể nó bị gán 1 ID rác, 
    // ta lấy toàn bộ list ra kiểm tra
    const allBuildings = await Building.find();
    let updatedCount = 0;

    for (const building of allBuildings) {
      // Nếu building chưa có chủ, gán cho admin
      if (!building.landlordId) {
        building.landlordId = adminId;
        await building.save();
        updatedCount++;
        console.log(`Updated Building ${building.name} -> assigned to Admin`);
      } else {
        // Kiểm tra xem landlordId có tồn tại trong bảng User không
        const landlordExists = await userModel.findById(building.landlordId);
        if (!landlordExists) {
          building.landlordId = adminId;
          await building.save();
          updatedCount++;
          console.log(`Updated Building ${building.name} (Old owner not found) -> assigned to Admin`);
        }
      }
    }

    console.log(`--- Migration completed: Updated ${updatedCount} buildings ---`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
};

migrateOwnership();
