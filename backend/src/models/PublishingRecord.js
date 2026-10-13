const mongoose = require("mongoose");

const publishingRecordSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    version: { type: mongoose.Schema.Types.ObjectId, ref: "VideoVersion" },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    youtubeVideoId: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },

    // YouTube playlist details
    youtubePlaylistId: { type: String, default: "" },
    youtubePlaylistTitle: { type: String, default: "" },

    title: { type: String, default: "" },
    description: { type: String, default: "" },

    privacyStatus: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },

    tags: { type: [String], default: [] },

    mode: {
      type: String,
      enum: ["youtube", "demo"],
      default: "demo",
    },

    status: {
      type: String,
      enum: ["pending", "uploading", "succeeded", "failed"],
      default: "pending",
    },

    error: { type: String, default: "" },
  },
  { timestamps: true }
);

const PublishingRecord = mongoose.model(
  "PublishingRecord",
  publishingRecordSchema
);

module.exports = { PublishingRecord };