const { Project, VideoVersion } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { hashToken } = require("../utils/tokens");

async function loadByToken(raw) {
  if (!raw) throw new ApiError(400, "Missing review token");
  const project = await Project.findOne({
    reviewTokenHash: hashToken(raw),
    reviewTokenExpiresAt: { $gt: new Date() },
  })
    .select("+reviewTokenHash")
    .populate("editor", "name email role")
    .populate("currentVersion");
  if (!project) {
    throw new ApiError(404, "This review link is invalid or has expired");
  }
  return project;
}

const getByToken = asyncHandler(async (req, res) => {
  const project = await loadByToken(req.params.token);
  const registered = Boolean(project.reviewer);
  res.json({
    requiresLogin: true,
    registered,
    reviewerEmail: project.reviewerEmail,
    project: {
      _id: project._id,
      title: project.title,
      status: project.status,
    },
  });
});

const claimByToken = asyncHandler(async (req, res) => {
  const project = await loadByToken(req.params.token);
  const email = req.user.email;
  if (email !== project.reviewerEmail && req.user.role !== "admin") {
    throw new ApiError(403, "This review link was sent to a different email address");
  }
  if (!project.reviewer) {
    project.reviewer = req.user._id;
    await project.save();
  }
  const versions = await VideoVersion.find({ project: project._id }).sort({
    versionNumber: -1,
  });
  res.json({
    projectId: project._id,
    project,
    versions,
  });
});

module.exports = { getByToken, claimByToken };
