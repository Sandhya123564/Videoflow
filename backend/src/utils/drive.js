const ApiError = require("./apiError");

function extractDriveFileId(raw) {
  if (!raw || typeof raw !== "string") return null;
  const value = raw.trim();
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?[^#]*id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?[^#]*id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseDriveLink(raw) {
  const fileId = extractDriveFileId(raw);
  if (!fileId) {
    throw new ApiError(
      400,
      "That does not look like a Google Drive file link. Use a link like https://drive.google.com/file/d/FILE_ID/view"
    );
  }
  return {
    fileId,
    driveUrl: `https://drive.google.com/file/d/${fileId}/view`,
    embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    url: `https://drive.google.com/file/d/${fileId}/preview`,
  };
}

module.exports = { extractDriveFileId, parseDriveLink };
