import mongoose, { Schema, model } from "mongoose";

const contractSchema = new Schema(
  {
    contractCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    deposit: {
      type: Number,
      required: true,
      min: 0,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    electricityPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    waterPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "expired", "terminated"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Indexes
contractSchema.index({ roomId: 1 });
contractSchema.index({ tenantId: 1 });
contractSchema.index({ status: 1 });

const Contract = model("Contract", contractSchema);

export default Contract;
