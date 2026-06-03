import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["NEW_INVOICE", "INVOICE_PAID", "OVERDUE_INVOICE", "CONTRACT_EXPIRING", "CONTRACT_EXPIRED", "SYSTEM"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = model("Notification", notificationSchema);

export default Notification;
