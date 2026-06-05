import mongoose, { Schema, model } from "mongoose";

const tenantSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    identityCard: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    homeTown: {
      type: String,
      required: true,
      trim: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
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

const Tenant = model("Tenant", tenantSchema);

export default Tenant;
