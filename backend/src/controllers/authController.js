const { User, Invite } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { signAccessToken, createReviewToken, hashToken } = require("../utils/tokens");
const env = require("../config/env");
const { deliverEmail, emailMode } = require("../services/emailService");

async function sendVerificationEmail(user, rawToken) {
  const link = `${env.clientOrigin}/verify-email?token=${rawToken}`;
  return deliverEmail({
    to: user.email,
    subject: "Verify your VideoFlow email",
    text: `Hi ${user.name},\n\nConfirm this address to finish creating your account:\n${link}\n\nThis link expires in 48 hours.\n`,
  });
}

async function issueVerifyToken(user) {
  const token = createReviewToken();
  user.emailVerifyHash = token.hash;
  user.emailVerifyExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await user.save();
  return token.raw;
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, inviteToken } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists");
  }

  let assignedRole = role === "reviewer" ? "reviewer" : "editor";
  let invite = null;
  if (inviteToken) {
    invite = await Invite.findOne({
      tokenHash: hashToken(inviteToken),
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).select("+tokenHash");
    if (!invite) {
      throw new ApiError(400, "This invitation is invalid or has expired");
    }
    if (invite.email !== email.toLowerCase()) {
      throw new ApiError(400, "Register with the email address that received the invite");
    }
    assignedRole = invite.role;
  }

  const passwordHash = await User.hashPassword(password);
  const autoVerify = env.skipEmailVerify || Boolean(invite);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: assignedRole,
    emailVerified: autoVerify,
  });

  if (invite) {
    invite.usedAt = new Date();
    await invite.save();
  }

  let emailResult = { delivered: false, mode: emailMode() };
  if (!user.emailVerified) {
    const raw = await issueVerifyToken(user);
    emailResult = await sendVerificationEmail(user, raw);
    return res.status(201).json({
      requiresVerification: true,
      email: user.email,
      emailDelivery: emailResult,
      user: user.toSafeJSON(),
    });
  }

  const token = signAccessToken(user);
  res.status(201).json({
    token,
    user: user.toSafeJSON(),
    emailDelivery: emailResult,
    invited: Boolean(invite),
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const raw = req.query.token || req.body.token;
  if (!raw) throw new ApiError(400, "Missing verification token");
  const user = await User.findOne({
    emailVerifyHash: hashToken(raw),
    emailVerifyExpiresAt: { $gt: new Date() },
  }).select("+emailVerifyHash +emailVerifyExpiresAt");
  if (!user) {
    throw new ApiError(400, "This verification link is invalid or has expired");
  }
  user.emailVerified = true;
  user.emailVerifyHash = undefined;
  user.emailVerifyExpiresAt = undefined;
  await user.save();
  const token = signAccessToken(user);
  res.json({ token, user: user.toSafeJSON() });
});

const resendVerification = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const user = await User.findOne({ email }).select("+emailVerifyHash");
  if (!user) {
    return res.json({ message: "If that account exists, a verification email was prepared." });
  }
  if (user.emailVerified) {
    return res.json({ message: "This email is already verified. You can sign in." });
  }
  const raw = await issueVerifyToken(user);
  const emailDelivery = await sendVerificationEmail(user, raw);
  res.json({ message: "Verification email prepared.", emailDelivery });
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid email or password");
  }

  const ok = await user.comparePassword(req.body.password);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.emailVerified && !env.skipEmailVerify) {
    throw new ApiError(403, "Verify your email before signing in", { code: "EMAIL_NOT_VERIFIED" });
  }

  const token = signAccessToken(user);
  res.json({ token, user: user.toSafeJSON() });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON(), emailMode: emailMode() });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out" });
});

const invitePreview = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({
    tokenHash: hashToken(req.params.token),
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!invite) throw new ApiError(404, "This invitation is invalid or has expired");
  res.json({
    email: invite.email,
    role: invite.role,
    projectId: invite.project,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const user = await User.findOne({ email });
  const generic = { message: "If that account exists, a reset email was prepared." };
  if (!user) return res.json(generic);
  const token = createReviewToken();
  user.passwordResetHash = token.hash;
  user.passwordResetExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await user.save();
  const link = `${env.clientOrigin}/reset-password?token=${token.raw}`;
  const emailDelivery = await deliverEmail({
    to: user.email,
    subject: "Reset your VideoFlow password",
    text: `Reset link (expires in 2 hours):\n${link}\n`,
  });
  res.json({ ...generic, emailDelivery });
});

const resetPassword = asyncHandler(async (req, res) => {
  const raw = req.body.token;
  const password = req.body.password;
  if (!raw || !password || password.length < 8) {
    throw new ApiError(400, "Token and a password of at least 8 characters are required");
  }
  const user = await User.findOne({
    passwordResetHash: hashToken(raw),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetHash +passwordResetExpiresAt");
  if (!user) throw new ApiError(400, "This reset link is invalid or has expired");
  user.passwordHash = await User.hashPassword(password);
  user.passwordResetHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  res.json({ message: "Password updated. You can sign in." });
});
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    throw new ApiError(
      400,
      "Current password and a new password of at least 8 characters are required"
    );
  }

  const user = await User.findById(req.user._id).select("+passwordHash");

  if (!user || !user.isActive) {
    throw new ApiError(401, "Authentication required");
  }

  const ok = await user.comparePassword(currentPassword);

  if (!ok) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.passwordResetHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  res.json({ message: "Password changed successfully." });
});

module.exports = {
  register,
  login,
  me,
  logout,
  verifyEmail,
  resendVerification,
  invitePreview,
  forgotPassword,
  resetPassword,
  changePassword,
};
