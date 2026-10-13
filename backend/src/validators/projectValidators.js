const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/apiError");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, "Validation failed", errors.array()));
  }
  next();
}

const createProjectRules = [
  body("title").trim().isLength({ min: 3, max: 160 }).withMessage("Title is required"),
  body("description").optional().isLength({ max: 5000 }),
  body("reviewerEmail").isEmail().normalizeEmail().withMessage("Reviewer email is required"),
  body("driveLink").optional({ checkFalsy: true }).isString(),
  body("notes").optional().isLength({ max: 2000 }),
  body("youtubeTitle").optional().isLength({ max: 160 }),
  body("youtubeDescription").optional().isLength({ max: 5000 }),
  body("priority").optional().isIn(["low", "normal", "high", "urgent"]),
  body("deadline").optional({ checkFalsy: true }).isISO8601(),
  handleValidation,
];

const updateProjectRules = [
  body("title").optional().trim().isLength({ min: 3, max: 160 }),
  body("description").optional().isLength({ max: 5000 }),
  body("reviewerEmail").optional().isEmail().normalizeEmail(),
  body("youtubeTitle").optional().isLength({ max: 160 }),
  body("youtubeDescription").optional().isLength({ max: 5000 }),
  body("youtubePrivacy").optional().isIn(["private", "unlisted", "public"]),
  body("priority").optional().isIn(["low", "normal", "high", "urgent"]),
  body("deadline").optional({ checkFalsy: true }).isISO8601(),
  handleValidation,
];

module.exports = { createProjectRules, updateProjectRules };
