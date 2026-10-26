const fs = require("fs");
const path = require("path");
const env = require("../config/env");

function cloudinaryReady() {
  return Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret
  );
}

async function persistLocalFile(file) {
  return {
    storageProvider: "local",
    sourceType: "upload",
    url: `/uploads/${path.basename(file.path)}`,
    cloudinaryPublicId: "",
    thumbnailUrl: "",
    originalFilename: file.originalname || "",
    mimeType: file.mimetype || "video/mp4",
    fileSize: file.size || 0,
  };
}

async function persistCloudinary(file) {
  const cloudinary = require("cloudinary").v2;

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });

  const result = await cloudinary.uploader.upload_large(file.path, {
  resource_type: "video",
  folder: "videoflow",
  chunk_size: 6000000,
});
  try {
    fs.unlinkSync(file.path);
  } catch {
    // Temporary local file cleanup can fail safely.
  }

  return {
    storageProvider: "cloudinary",
    sourceType: "upload",
    url: result.secure_url,
    cloudinaryPublicId: result.public_id,
    thumbnailUrl: result.secure_url.replace(/\.[a-z0-9]+$/i, ".jpg"),
    originalFilename: file.originalname || "",
    mimeType: file.mimetype || "video/mp4",
    fileSize: file.size || result.bytes || 0,
    durationSeconds: Math.round(result.duration || 0),
  };
}

async function storeUploadedVideo(file) {
  if (!file) {
    throw new Error("No file received");
  }

  if (!cloudinaryReady()) {
    throw new Error(
      "Cloudinary is not configured. Check Render environment variables."
    );
  }

  return await persistCloudinary(file);
}

module.exports = {
  storeUploadedVideo,
  cloudinaryReady,
};