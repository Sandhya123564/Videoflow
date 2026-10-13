const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoVersion",
      required: true,
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorEmail: { type: String, lowercase: true, trim: true },
    authorName: { type: String, default: "Reviewer" },
    timestampSeconds: { type: Number, required: true, min: 0 },
    body: { type: String, required: true, maxlength: 2000 },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = { Comment };
