const { Approval, User } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { loadVisibleProject } = require("../utils/projectAccess");
const { notify, findHeads } = require("../services/notify");
const env = require("../config/env");

function isAssignedReviewer(user, project) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "reviewer") return false;
  return (
    String(project.reviewer?._id || project.reviewer || "") === String(user._id) ||
    project.reviewerEmail === user.email
  );
}

const reviewerDecide = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  if (!isAssignedReviewer(req.user, project)) {
    throw new ApiError(403, "Only the assigned reviewer can decide");
  }
  if (project.status !== "pending_review") {
    throw new ApiError(400, "This project is not waiting on a reviewer decision");
  }

  const action = req.body.action;
  if (!["approve", "request_changes"].includes(action)) {
    throw new ApiError(400, "action must be approve or request_changes");
  }

  const note = (req.body.note || "").trim();
  project.status = action === "approve" ? "pending_head_review" : "changes_requested";
  if (action === "approve") {
    const head = await User.findOne({ role: "head", isActive: true });
    if (head) project.head = head._id;
  }
  await project.save();

  await Approval.create({
    project: project._id,
    version: project.currentVersion,
    actor: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role === "admin" ? "admin" : "reviewer",
    action,
    note,
  });

  const editor = project.editor;
  if (action === "request_changes") {
    await notify({
      user: editor,
      email: editor?.email,
      type: "changes_requested",
      title: `Changes requested: ${project.title}`,
      body: `${req.user.name} requested changes.${note ? `\n\n${note}` : ""}\n\nUpload a revised version, then send it for review again.`,
      project,
      reviewPath: `/projects/${project._id}`,
    });
  } else {
    await notify({
      user: editor,
      email: editor?.email,
      type: "reviewer_approved",
      title: `Reviewer approved: ${project.title}`,
      body: `${req.user.name} approved this version. It is now in the Head queue.`,
      project,
      reviewPath: `/projects/${project._id}`,
    });
    const heads = await findHeads();
    for (const head of heads) {
      await notify({
        user: head,
        email: head.email,
        type: "reviewer_approved",
        title: `Ready for final review: ${project.title}`,
        body: `A reviewer approved "${project.title}". Open the Head queue to approve or request more changes.`,
        project,
        reviewPath: `/projects/${project._id}`,
      });
    }
  }

  res.json({ project, appOrigin: env.clientOrigin });
});

const headDecide = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  if (!["head", "admin"].includes(req.user.role)) {
    throw new ApiError(403, "Only the Head can make a final decision");
  }
  if (project.status !== "pending_head_review") {
    throw new ApiError(400, "This project is not waiting on Head review");
  }

  const action = req.body.action;
  if (!["approve", "request_changes"].includes(action)) {
    throw new ApiError(400, "action must be approve or request_changes");
  }

  const note = (req.body.note || "").trim();
  project.status = action === "approve" ? "approved" : "changes_requested_by_head";
  project.head = req.user.role === "head" ? req.user._id : project.head;
  await project.save();

  await Approval.create({
    project: project._id,
    version: project.currentVersion,
    actor: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role === "admin" ? "admin" : "head",
    action,
    note,
  });

  const editor = project.editor;
  if (action === "request_changes") {
    await notify({
      user: editor,
      email: editor?.email,
      type: "changes_requested",
      title: `Head requested changes: ${project.title}`,
      body: `${req.user.name} requested further changes.${note ? `\n\n${note}` : ""}\n\nUpload a revised version and send it for review again.`,
      project,
      reviewPath: `/projects/${project._id}`,
    });
  } else {
    await notify({
      user: editor,
      email: editor?.email,
      type: "head_approved",
      title: `Final approval: ${project.title}`,
      body: `${req.user.name} gave final approval. YouTube publishing is a later phase.`,
      project,
      reviewPath: `/projects/${project._id}`,
    });
  }

  res.json({ project });
});

module.exports = { reviewerDecide, headDecide };
