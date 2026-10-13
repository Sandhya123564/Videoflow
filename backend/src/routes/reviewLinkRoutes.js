const express = require("express");
const publicReviewController = require("../controllers/publicReviewController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/:token", publicReviewController.getByToken);
router.post("/:token/claim", authenticate, publicReviewController.claimByToken);

module.exports = router;
