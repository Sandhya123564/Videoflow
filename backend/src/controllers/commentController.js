const { Comment } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { loadVisibleProject, canEditProject } = require("../utils/projectAccess");

function canComment(user, project) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (canEditProject(user, project)) return true;
  if (user.role === "reviewer") {
    return (
      String(project.reviewer?._id || project.reviewer || "") === String(user._id) ||
      project.reviewerEmail === user.email
    );
  }
  if (user.role === "head") {
    return [
      "pending_head_review",
      "changes_requested_by_head",
      "approved",
      "published",
    ].includes(project.status);
  }
  return false;
}

const list = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  const filter = { project: project._id };
  if (req.query.versionId) filter.version = req.query.versionId;
  const comments = await Comment.find(filter)
    .populate("author", "name email role")
    .sort({ timestampSeconds: 1, createdAt: 1 });
  res.json({ comments });
});

const create = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  if (!canComment(req.user, project)) {
    throw new ApiError(403, "You cannot comment on this project");
  }

  const versionId = req.body.versionId || project.currentVersion?._id || project.currentVersion;
  if (!versionId) {
    throw new ApiError(400, "A video version is required before commenting");
  }

  const timestampSeconds = Number(req.body.timestampSeconds);
  if (Number.isNaN(timestampSeconds) || timestampSeconds < 0) {
    throw new ApiError(400, "timestampSeconds must be a number of seconds");
  }
  const body = (req.body.body || "").trim();
  if (body.length < 1) {
    throw new ApiError(400, "Comment text is required");
  }

  const comment = await Comment.create({
    project: project._id,
    version: versionId,
    author: req.user._id,
    authorEmail: req.user.email,
    authorName: req.user.name,
    timestampSeconds: Math.floor(timestampSeconds),
    body,
  });

  const populated = await comment.populate("author", "name email role");
  res.status(201).json({ comment: populated });
});

const resolve = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  if (!canEditProject(req.user, project) && req.user.role !== "admin") {
    throw new ApiError(403, "Only the editor can resolve comments");
  }
  const comment = await Comment.findOne({
    _id: req.params.commentId,
    project: project._id,
  });
  if (!comment) throw new ApiError(404, "Comment not found");
  comment.resolved = Boolean(req.body.resolved);
  await comment.save();
  res.json({ comment });
});

module.exports = { list, create, resolve, canComment };
