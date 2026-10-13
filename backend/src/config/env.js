const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/videoflow"),
  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  reviewTokenDays: Number(process.env.REVIEW_TOKEN_DAYS || 14),
  skipEmailVerify: String(process.env.SKIP_EMAIL_VERIFY || "true").toLowerCase() === "true",
  mediaPublic: String(process.env.MEDIA_PUBLIC || "true").toLowerCase() === "true",
  inviteDays: Number(process.env.INVITE_DAYS || 14),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.RESEND_FROM || "VideoFlow <noreply@example.com>",
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
    redirectUri:
      process.env.YOUTUBE_REDIRECT_URI ||
      "http://localhost:5000/api/v1/youtube/callback",
  },
};

module.exports = env;
