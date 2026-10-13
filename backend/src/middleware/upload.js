const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ApiError = require("../utils/apiError");

const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowed = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/mpeg",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".mp4";
    const safeExt = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".mpeg"].includes(ext)
      ? ext
      : ".mp4";
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/") || allowed.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new ApiError(400, "Only video files can be uploaded"));
  },
});

module.exports = { upload, uploadDir };
