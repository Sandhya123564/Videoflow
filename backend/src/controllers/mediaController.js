const path = require("path");
const fs = require("fs");
const { VideoVersion } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { canViewProject } = require("../utils/projectAccess");
const { loadProject } = require("../utils/projectAccess");

const streamFile = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename || "");
  if (!filename) throw new ApiError(400, "Missing file");

  const version = await VideoVersion.findOne({
    url: new RegExp(`${filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  });
  if (!version) throw new ApiError(404, "Media not found");

  const project = await loadProject(version.project);
  if (!canViewProject(req.user, project)) {
    throw new ApiError(403, "You cannot access this video");
  }

  const full = path.join(__dirname, "../../uploads", filename);
  if (!fs.existsSync(full)) throw new ApiError(404, "File missing on disk");

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.sendFile(full);
});

module.exports = { streamFile };
