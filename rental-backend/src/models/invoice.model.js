import mongoose, { Schema, model } from "mongoose";

const invoiceSchema = new Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    roomPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    electricityPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    waterPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    oldElectricityIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    newElectricityIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    oldWaterIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    newWaterIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    otherFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "cancelled"],
      default: "draft",
    },
  },
  { timestamps: true },
);

// Tính toán totalAmount trước khi validate để pass require
invoiceSchema.pre("validate", function () {
  if (
    this.isModified("newElectricityIndex") ||
    this.isModified("oldElectricityIndex") ||
    this.isModified("newWaterIndex") ||
    this.isModified("oldWaterIndex") ||
    this.isModified("otherFees")
  ) {
    const electricityUsed = Math.max(
      0,
      (this.newElectricityIndex || 0) - (this.oldElectricityIndex || 0),
    );
    const waterUsed = Math.max(
      0,
      (this.newWaterIndex || 0) - (this.oldWaterIndex || 0),
    );

    const electricityCost =
      electricityUsed * (this.electricityPriceSnapshot || 0);
    const waterCost = waterUsed * (this.waterPriceSnapshot || 0);

    this.totalAmount =
      (this.roomPriceSnapshot || 0) +
      electricityCost +
      waterCost +
      (this.otherFees || 0);
  }
});

// Chống trùng lặp mức DB: 1 hợp đồng chỉ có 1 hóa đơn cho 1 tháng cụ thể
invoiceSchema.index({ contractId: 1, month: 1, year: 1 }, { unique: true });
invoiceSchema.index({ status: 1 });

const Invoice = model("Invoice", invoiceSchema);

export default Invoice;
