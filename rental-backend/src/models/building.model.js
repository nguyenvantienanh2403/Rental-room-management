import mongoose from "mongoose";
const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      slug: "name",
      unique: true,
      slugPaddingSize: 2,
    },
    type: {
      type: String,
      enum: ["apartment", "boarding_house", "dormitory", "studio", "other"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      street: { type: String, required: true, trim: true },
      ward: { type: String, trim: true, default: "" },
      district: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    services: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
    totalRooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);
// Index cho search và filter
buildingSchema.index({ landlordId: 1 });
buildingSchema.index({ "address.city": 1, "address.district": 1 });
buildingSchema.index({ status: 1 });
const Building = mongoose.model("Building", buildingSchema);
export default Building;
