import mongoose, { Schema, model } from "mongoose";

const tokenSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
      expires: 60 * 60 * 24 * 7, // 7 days
    },
  },
  { timestamps: true },
);

const Token = model("Token", tokenSchema);
export default Token;
