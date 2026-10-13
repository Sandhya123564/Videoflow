const express = require("express");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const projectRoutes = require("./projectRoutes");
const reviewLinkRoutes = require("./reviewLinkRoutes");
const notificationRoutes = require("./notificationRoutes");
const youtubeRoutes = require("./youtubeRoutes");
const mediaController = require("../controllers/mediaController");
const { authenticate } = require("../middleware/auth");
const { emailMode } = require("../services/emailService");
const yt = require("../services/youtubeService");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "videoflow-api",
    phase: 5,
    time: new Date().toISOString(),
    emailMode: emailMode(),
    youtubeDemo: yt.isDemoMode(),
  });
});
router.get("/media/:filename", authenticate, mediaController.streamFile);

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/projects", projectRoutes);
router.use("/review", reviewLinkRoutes);
router.use("/notifications", notificationRoutes);
router.use("/youtube", youtubeRoutes);

module.exports = router;
