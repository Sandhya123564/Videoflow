const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["editor", "reviewer", "head", "admin"];

const youtubeAuthSchema = new mongoose.Schema(
  {
    channelId: String,
    channelTitle: String,
    accessToken: String,
    refreshToken: String,
    expiryDate: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "editor" },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyHash: { type: String, select: false },
    emailVerifyExpiresAt: { type: Date, select: false },
    passwordResetHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    youtube: { type: youtubeAuthSchema, default: undefined },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    hasYouTube: Boolean(this.youtube && this.youtube.refreshToken),
    youtubeChannelTitle: this.youtube?.channelTitle || "",
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };
