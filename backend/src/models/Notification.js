const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, lowercase: true, trim: true },
    type: {
      type: String,
      enum: [
        "review_invite",
        "changes_requested",
        "reviewer_approved",
        "head_approved",
        "published",
        "user_invite",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    read: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    deliveryMode: { type: String, default: "" },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };
