const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    version: { type: mongoose.Schema.Types.ObjectId, ref: "VideoVersion" },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String, lowercase: true, trim: true },
    actorRole: {
      type: String,
      enum: ["reviewer", "head", "admin", "editor"],
      required: true,
    },
    action: {
      type: String,
      enum: ["approve", "request_changes", "submit_for_review", "publish"],
      required: true,
    },
    note: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

const Approval = mongoose.model("Approval", approvalSchema);

module.exports = { Approval };
