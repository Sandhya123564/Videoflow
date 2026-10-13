const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/apiError");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, "Validation failed", errors.array()));
  }
  next();
}

const registerRules = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["editor", "reviewer"])
    .withMessage("Self-registration is limited to editor or reviewer"),
  handleValidation,
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  handleValidation,
];

const createUserRules = [
  body("name").trim().isLength({ min: 2, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("role").isIn(["editor", "reviewer", "head", "admin"]),
  handleValidation,
];

module.exports = { registerRules, loginRules, createUserRules, handleValidation };
