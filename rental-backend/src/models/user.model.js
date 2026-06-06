import mongoose, { Schema, model } from "mongoose";
import mongooseSlugUpdater from "mongoose-slug-updater";
import crypto from "crypto";
import bcrypt from "bcrypt";
import env from "../config/env.config.js";

mongoose.plugin(mongooseSlugUpdater);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    identityCard: {
      type: String,
      trim: true,
    },
    homeTown: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    slug: {
      type: String,
      slug: "username",
      unique: true,
      slugPaddingSize: 2,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    bankInfo: {
      bankId: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountName: { type: String, trim: true },
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    newEmailPending: String,
    emailChangeOTP: String,
    emailChangeExpires: Date,
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const saltRounds = env.bcrypt.saltRounds;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

const User = model("User", userSchema);

export default User;
