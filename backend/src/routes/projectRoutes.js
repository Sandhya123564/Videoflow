const express = require("express");
const projectController = require("../controllers/projectController");
const versionController = require("../controllers/versionController");
const commentController = require("../controllers/commentController");
const reviewController = require("../controllers/reviewController");
const youtubeController = require("../controllers/youtubeController");
const { authenticate, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  createProjectRules,
  updateProjectRules,
} = require("../validators/projectValidators");

const router = express.Router();

router.use(authenticate);

router.get("/", projectController.listMine);
router.post(
  "/",
  authorize("editor", "admin"),
  upload.single("video"),
  createProjectRules,
  projectController.create
);
router.get("/:id", projectController.getOne);
router.delete(
  "/:id",
  authorize("editor", "admin"),
  projectController.deleteProject
);
router.patch(
  "/:id",
  authorize("editor", "admin"),
  updateProjectRules,
  projectController.update
);
router.post(
  "/:id/submit",
  authorize("editor", "admin"),
  projectController.submitForReview
);
router.get("/:id/versions", versionController.list);
router.post(
  "/:id/versions",
  authorize("editor", "admin"),
  upload.single("video"),
  versionController.create
);
router.get("/:id/comments", commentController.list);
router.post("/:id/comments", commentController.create);
router.patch("/:id/comments/:commentId", commentController.resolve);
router.post(
  "/:id/review",
  authorize("reviewer", "admin"),
  reviewController.reviewerDecide
);
router.post(
  "/:id/head-review",
  authorize("head", "admin"),
  reviewController.headDecide
);
router.get("/:id/publishing", youtubeController.listPublishing);
router.post("/:id/publish", authorize("head"), youtubeController.publish);
router.get("/:id/publish/:recordId", youtubeController.publishStatus);

module.exports = router;
