const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);
router.get("/", notificationController.listMine);
router.post("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

module.exports = router;
