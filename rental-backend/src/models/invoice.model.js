import mongoose, { Schema, model } from "mongoose";

const invoiceSchema = new Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    meterReadingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeterReading",
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
    roomCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    electricityUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    waterUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    electricityTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    waterTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    otherFees: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    discount: {
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
  { timestamps: true }
);

// Chống trùng lặp mức DB: 1 hợp đồng chỉ có 1 hóa đơn cho 1 tháng cụ thể
invoiceSchema.index({ contractId: 1, month: 1, year: 1 }, { unique: true });
invoiceSchema.index({ status: 1 });

const Invoice = model("Invoice", invoiceSchema);

export default Invoice;
