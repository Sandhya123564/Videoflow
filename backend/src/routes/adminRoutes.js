const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");
const { createUserRules } = require("../validators/authValidators");
const { body } = require("express-validator");
const { handleValidation } = require("../validators/authValidators");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/users", adminController.listUsers);
router.post("/users", createUserRules, adminController.createUser);
router.patch(
  "/users/:id/active",
  body("isActive").isBoolean(),
  handleValidation,
  adminController.setUserActive
);
router.patch(
  "/users/:id/role",
  body("role").isIn(["editor", "reviewer", "head", "admin"]),
  handleValidation,
  adminController.updateUserRole
);
router.post(
  "/invites",
  body("email").isEmail().normalizeEmail(),
  body("role").isIn(["editor", "reviewer", "head", "admin"]),
  handleValidation,
  adminController.inviteUser
);

module.exports = router;
