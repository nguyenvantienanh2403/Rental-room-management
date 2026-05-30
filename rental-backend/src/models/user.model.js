import mongoose, { Schema, model } from "mongoose";
import slug from "mongoose-slug-generator";

mongoose.plugin(slug);

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
