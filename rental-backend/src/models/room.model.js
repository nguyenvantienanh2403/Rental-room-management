import mongoose, { Schema, model } from "mongoose";
import mongooseSlugUpdater from "mongoose-slug-updater";

mongoose.plugin(mongooseSlugUpdater);

const roomSchema = new Schema(
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
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    area: {
      type: Number,
      min: 0,
    },
    maxCapacity: {
      type: Number,
      default: 3,
      min: 1,
    },
    status: {
      type: String,
      enum: ["available", "rented", "maintenance"],
      default: "available",
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
roomSchema.index({ buildingId: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ price: 1 });

// Virtual Populate Tenants
roomSchema.virtual("tenants", {
  ref: "Tenant",
  localField: "_id",
  foreignField: "roomId",
});

const Room = model("Room", roomSchema);

export default Room;
