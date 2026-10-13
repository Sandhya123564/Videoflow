const express = require("express");
const youtubeController = require("../controllers/youtubeController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/callback", youtubeController.callback);

router.use(authenticate);

router.get("/status", youtubeController.status);
router.get("/playlists", youtubeController.playlists);

router.post("/connect", youtubeController.connect);
router.post("/disconnect", youtubeController.disconnect);

module.exports = router;