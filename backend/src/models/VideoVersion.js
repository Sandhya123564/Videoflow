const mongoose = require("mongoose");

const videoVersionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true, min: 1 },
    sourceType: { type: String, enum: ["upload", "gdrive"], required: true },
    storageProvider: {
      type: String,
      enum: ["local", "cloudinary", "gdrive"],
      required: true,
    },
    url: { type: String, required: true },
    embedUrl: { type: String, default: "" },
    driveUrl: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    originalFilename: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    notes: { type: String, default: "", maxlength: 2000 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

videoVersionSchema.index({ project: 1, versionNumber: 1 }, { unique: true });

const VideoVersion = mongoose.model("VideoVersion", videoVersionSchema);

module.exports = { VideoVersion };
