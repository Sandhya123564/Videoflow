const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { registerRules, loginRules } = require("../validators/authValidators");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts. Try again in 15 minutes." },
});

router.post("/register", authLimiter, registerRules, authController.register);
router.post("/login", authLimiter, loginRules, authController.login);
router.get("/verify", authController.verifyEmail);
router.post("/verify", authController.verifyEmail);
router.post("/resend-verification", authLimiter, authController.resendVerification);
router.get("/invites/:token", authController.invitePreview);
router.post("/forgot", authLimiter, authController.forgotPassword);
router.post("/reset", authLimiter, authController.resetPassword);
router.post(
  "/change-password",
  authenticate,
  authLimiter,
  authController.changePassword
);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
