import mongoose, { Schema, model } from "mongoose";

const meterReadingSchema = new Schema(
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
    electricity: {
      oldIndex: { type: Number, required: true, min: 0 },
      newIndex: { type: Number, required: true, min: 0 },
      isMeterReplaced: { type: Boolean, default: false },
    },
    water: {
      oldIndex: { type: Number, min: 0 },
      newIndex: { type: Number, min: 0 },
      isMeterReplaced: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Logic Chống trùng lặp (De-duplication)
meterReadingSchema.index({ contractId: 1, month: 1, year: 1 }, { unique: true });

const MeterReading = model("MeterReading", meterReadingSchema);

export default MeterReading;
