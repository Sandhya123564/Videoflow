const { User } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { createInvite } = require("../services/inviteService");

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists");
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role, emailVerified: true });
  res.status(201).json({ user: user.toSafeJSON() });
});

const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user._id.equals(req.user._id)) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }
  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ user: user.toSafeJSON() });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.role = req.body.role;
  await user.save();
  res.json({ user: user.toSafeJSON() });
});

const inviteUser = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const role = req.body.role || "reviewer";
  if (!email) throw new ApiError(400, "Email is required");
  const result = await createInvite({
    email,
    role,
    invitedBy: req.user,
  });
  if (result.existingUser) {
    result.existingUser.role = role;
    await result.existingUser.save();
    return res.json({
      existing: true,
      user: result.existingUser.toSafeJSON(),
      message: "User already exists. Role updated.",
    });
  }
  res.status(201).json({
    existing: false,
    inviteId: result.invite._id,
    registerPath: `/register?invite=${result.raw}`,
  });
});

module.exports = { listUsers, createUser, setUserActive, updateUserRole, inviteUser };
