const { Project, VideoVersion, Approval, User, Comment, PublishingRecord } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { parseDriveLink } = require("../utils/drive");
const { storeUploadedVideo } = require("../services/storageService");
const {
  canEditProject,
  loadVisibleProject,
} = require("../utils/projectAccess");
const { createReviewToken } = require("../utils/tokens");
const env = require("../config/env");
const { notify, findUserByEmail } = require("../services/notify");
const { createInvite } = require("../services/inviteService");
const { emailMode } = require("../services/emailService");

function assertEditor(req, project) {
  if (!canEditProject(req.user, project)) {
    throw new ApiError(403, "Only the project editor can change this project");
  }
}

async function attachReviewer(project) {
  const user = await User.findOne({
    email: project.reviewerEmail,
    role: { $in: ["reviewer", "admin"] },
  });
  project.reviewer = user ? user._id : undefined;
}

async function nextVersionNumber(projectId) {
  const last = await VideoVersion.findOne({ project: projectId }).sort({
    versionNumber: -1,
  });
  return last ? last.versionNumber + 1 : 1;
}

async function createVersionFromRequest(req, project) {
  const notes = (req.body.notes || "").trim();
  const driveLink = (req.body.driveLink || "").trim();

  if (req.file && driveLink) {
    throw new ApiError(400, "Choose either a video file or a Drive link, not both");
  }

  if (req.file) {
    const stored = await storeUploadedVideo(req.file);
    return VideoVersion.create({
      project: project._id,
      versionNumber: await nextVersionNumber(project._id),
      notes,
      uploadedBy: req.user._id,
      ...stored,
      embedUrl: stored.url,
    });
  }

  if (driveLink) {
    const parsed = parseDriveLink(driveLink);
    return VideoVersion.create({
      project: project._id,
      versionNumber: await nextVersionNumber(project._id),
      sourceType: "gdrive",
      storageProvider: "gdrive",
      url: parsed.url,
      embedUrl: parsed.embedUrl,
      driveUrl: parsed.driveUrl,
      notes,
      uploadedBy: req.user._id,
    });
  }

  return null;
}

const listMine = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "editor") {
    filter.editor = req.user._id;
  } else if (req.user.role === "reviewer") {
    filter.$or = [{ reviewer: req.user._id }, { reviewerEmail: req.user.email }];
  } else if (req.user.role === "head") {
    filter.status = {
      $in: [
        "pending_head_review",
        "approved",
        "published",
        "changes_requested_by_head",
      ],
    };
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.q) {
    filter.title = { $regex: String(req.query.q).slice(0, 80), $options: "i" };
  }

  const projects = await Project.find(filter)
    .populate("editor", "name email role")
    .populate("currentVersion")
    .sort({ updatedAt: -1 })
    .limit(100);

  const statsFilter = { ...filter };
  delete statsFilter.status;
  delete statsFilter.title;
  const all = await Project.find(statsFilter).select("status");
  const stats = all.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});

  res.json({ projects, stats });
});

const create = asyncHandler(async (req, res) => {
  if (!["editor", "admin"].includes(req.user.role)) {
    throw new ApiError(403, "Only editors can create projects");
  }

  const project = await Project.create({
    title: req.body.title,
    description: req.body.description || "",
    editor: req.user._id,
    reviewerEmail: req.body.reviewerEmail,
    youtubeTitle: req.body.youtubeTitle || req.body.title,
    youtubeDescription: req.body.youtubeDescription || req.body.description || "",
    driveLink: req.body.driveLink || "",
    status: "draft",
    priority: req.body.priority || "normal",
    deadline: req.body.deadline || undefined,
  });

  await attachReviewer(project);
  if (!project.reviewer) {
    await createInvite({
      email: project.reviewerEmail,
      role: "reviewer",
      project,
      invitedBy: req.user,
    });
  }

  const version = await createVersionFromRequest(req, project);
  if (version) {
    project.currentVersion = version._id;
    if (version.driveUrl) project.driveLink = version.driveUrl;
  }
  await project.save();

  const populated = await Project.findById(project._id)
    .populate("editor", "name email role")
    .populate("currentVersion");

  res.status(201).json({ project: populated });
});

const getOne = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  const versions = await VideoVersion.find({ project: project._id })
    .populate("uploadedBy", "name email role")
    .sort({ versionNumber: -1 });
  const approvals = await Approval.find({ project: project._id }).sort({
    createdAt: -1,
  });
  const comments = await Comment.find({ project: project._id })
    .populate("author", "name email role")
    .sort({ timestampSeconds: 1, createdAt: 1 });
  const publishing = await PublishingRecord.find({ project: project._id }).sort({
    createdAt: -1,
  });
  res.json({ project, versions, approvals, comments, publishing });
});

const update = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  assertEditor(req, project);

  if (project.status === "published") {
    throw new ApiError(400, "Published projects cannot be edited");
  }

  const fields = [
    "title",
    "description",
    "reviewerEmail",
    "youtubeTitle",
    "youtubeDescription",
    "youtubePrivacy",
    "priority",
    "deadline",
  ];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  }
  if (req.body.reviewerEmail) {
    await attachReviewer(project);
  }
  await project.save();
  res.json({ project });
});

const submitForReview = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  assertEditor(req, project);

  const allowed = ["draft", "changes_requested", "changes_requested_by_head"];
  if (!allowed.includes(project.status)) {
    throw new ApiError(
      400,
      `Cannot send a project with status "${project.status}" for review`
    );
  }
  if (!project.currentVersion) {
    throw new ApiError(400, "Add a video version before sending for review");
  }

  project.status = "pending_review";
  const token = createReviewToken();
  project.reviewTokenHash = token.hash;
  project.reviewTokenExpiresAt = new Date(
    Date.now() + env.reviewTokenDays * 24 * 60 * 60 * 1000
  );
  await attachReviewer(project);
  await project.save();

  await Approval.create({
    project: project._id,
    version: project.currentVersion,
    actor: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role === "admin" ? "admin" : "editor",
    action: "submit_for_review",
    note: req.body.note || "",
  });

  const reviewerUser = await findUserByEmail(project.reviewerEmail);
  if (!reviewerUser) {
    await createInvite({
      email: project.reviewerEmail,
      role: "reviewer",
      project,
      invitedBy: req.user,
    });
  }
  const reviewPath = `/review/${token.raw}`;
  const delivery = await notify({
    user: reviewerUser,
    email: project.reviewerEmail,
    type: "review_invite",
    title: `Review requested: ${project.title}`,
    body: `${req.user.name} sent "${project.title}" for review.\n\n1. Sign in with ${project.reviewerEmail} (register first if you were invited).\n2. Open this secure review link:\n${env.clientOrigin}${reviewPath}\n\nThe link is unique and expires. Do not forward it.`,
    project,
    reviewPath,
  });

  res.json({
    project,
    reviewUrl: `${env.clientOrigin}${reviewPath}`,
    emailDelivery: delivery?._delivery || { mode: emailMode(), delivered: false },
  });
});
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  assertEditor(req, project);

  await Promise.all([
    VideoVersion.deleteMany({ project: project._id }),
    Approval.deleteMany({ project: project._id }),
    Comment.deleteMany({ project: project._id }),
    PublishingRecord.deleteMany({ project: project._id }),
  ]);

  await Project.findByIdAndDelete(project._id);

  res.json({ message: "Project deleted successfully" });
});

module.exports = { listMine, create, getOne, update, submitForReview,deleteProject, };
