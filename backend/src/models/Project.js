const mongoose = require("mongoose");

const PROJECT_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "pending_head_review",
  "changes_requested_by_head",
  "approved",
  "published",
];

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 5000 },
    editor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerEmail: { type: String, required: true, lowercase: true, trim: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "draft",
      index: true,
    },
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "VideoVersion" },
    driveLink: { type: String, default: "" },
    youtubeTitle: { type: String, default: "" },
    youtubeDescription: { type: String, default: "" },
    youtubePrivacy: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },
    reviewTokenHash: { type: String, select: false },
    reviewTokenExpiresAt: { type: Date },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    deadline: { type: Date },
  },
  { timestamps: true }
);

projectSchema.index({ editor: 1, createdAt: -1 });
projectSchema.index({ reviewerEmail: 1 });

const Project = mongoose.model("Project", projectSchema);

module.exports = { Project, PROJECT_STATUSES };
