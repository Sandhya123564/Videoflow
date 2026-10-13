const { VideoVersion } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { parseDriveLink } = require("../utils/drive");
const { storeUploadedVideo } = require("../services/storageService");
const { canEditProject, loadVisibleProject } = require("../utils/projectAccess");

async function nextVersionNumber(projectId) {
  const last = await VideoVersion.findOne({ project: projectId }).sort({
    versionNumber: -1,
  });
  return last ? last.versionNumber + 1 : 1;
}

const list = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  const versions = await VideoVersion.find({ project: project._id })
    .populate("uploadedBy", "name email role")
    .sort({ versionNumber: -1 });
  res.json({ versions });
});

const create = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  if (!canEditProject(req.user, project)) {
    throw new ApiError(403, "Only the project editor can add versions");
  }
  if (project.status === "published") {
    throw new ApiError(400, "Cannot add versions to a published project");
  }

  const notes = (req.body.notes || "").trim();
  const driveLink = (req.body.driveLink || "").trim();
  let payload;

  if (req.file && driveLink) {
    throw new ApiError(400, "Choose either a video file or a Drive link, not both");
  }

  if (req.file) {
    const stored = await storeUploadedVideo(req.file);
    payload = { ...stored, embedUrl: stored.url, notes };
  } else if (driveLink) {
    const parsed = parseDriveLink(driveLink);
    payload = {
      sourceType: "gdrive",
      storageProvider: "gdrive",
      url: parsed.url,
      embedUrl: parsed.embedUrl,
      driveUrl: parsed.driveUrl,
      notes,
    };
    project.driveLink = parsed.driveUrl;
  } else {
    throw new ApiError(400, "Attach a video file or paste a Google Drive link");
  }

  const version = await VideoVersion.create({
    project: project._id,
    versionNumber: await nextVersionNumber(project._id),
    uploadedBy: req.user._id,
    ...payload,
  });

  project.currentVersion = version._id;
  await project.save();

  res.status(201).json({ version, project });
});

module.exports = { list, create };
