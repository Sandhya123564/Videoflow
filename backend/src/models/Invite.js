const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: {
      type: String,
      enum: ["editor", "reviewer", "head", "admin"],
      default: "reviewer",
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

const Invite = mongoose.model("Invite", inviteSchema);

module.exports = { Invite };
