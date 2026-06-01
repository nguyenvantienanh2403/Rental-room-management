import mongoose, { Schema, model } from "mongoose";
import mongooseSlugUpdater from "mongoose-slug-updater";

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
  },
  { timestamps: true },
);

const User = model("User", userSchema);

export default User;
