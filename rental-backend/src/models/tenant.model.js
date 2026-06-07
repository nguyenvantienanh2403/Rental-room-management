import mongoose, { Schema, model } from "mongoose";

const tenantSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fullName: {
      type: String,
      required: [true, "Họ và tên khách thuê là bắt buộc"],
      trim: true,
    },
    identityCard: {
      type: String,
      required: [true, "Căn cước công dân là bắt buộc"],
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Số điện thoại khách thuê là bắt buộc"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    homeTown: {
      type: String,
      required: [true, "Quê quán khách thuê là bắt buộc"],
      trim: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "ID phòng thuê là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["active", "moved_out"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Indexes for performance
tenantSchema.index({ roomId: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ userId: 1 });

const Tenant = model("Tenant", tenantSchema);

export default Tenant;
