import connectDB from "../config/database.js";
import { roleModel } from "../models/index.js";

const roles = [{ name: "User" }, { name: "Admin" }];

const seedRoles = async () => {
  try {
    await connectDB();
    for (const role of roles) {
      const existingRole = await roleModel.findOne({ name: role.name });
      if (!existingRole) {
        await roleModel.create(role);
        console.log(`Created role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }
    console.log("Role seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Role seeding failed:", error.message);
    process.exit(1);
  }
};

seedRoles();
