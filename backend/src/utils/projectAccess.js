const { Project } = require("../models");
const ApiError = require("./apiError");

function idOf(ref) {
  if (!ref) return "";
  if (typeof ref === "object" && ref._id) return String(ref._id);
  return String(ref);
}

function canViewProject(user, project) {
  if (!user || !project) return false;
  if (user.role === "admin") return true;
  if (idOf(project.editor) === String(user._id)) return true;
  if (user.role === "reviewer") {
    if (idOf(project.reviewer) === String(user._id)) return true;
    if (project.reviewerEmail && project.reviewerEmail === user.email) return true;
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

function canEditProject(user, project) {
  if (!user || !project) return false;
  if (user.role === "admin") return true;
  return idOf(project.editor) === String(user._id);
}

async function loadProject(id) {
  const project = await Project.findById(id)
    .populate("editor", "name email role")
    .populate("reviewer", "name email role")
    .populate("currentVersion");
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  return project;
}

async function loadVisibleProject(req) {
  const project = await loadProject(req.params.id);
  if (!canViewProject(req.user, project)) {
    throw new ApiError(403, "You cannot view this project");
  }
  return project;
}

module.exports = {
  canViewProject,
  canEditProject,
  loadProject,
  loadVisibleProject,
};
