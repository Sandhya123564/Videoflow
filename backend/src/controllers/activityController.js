const { Approval, Comment, Notification } = require("../models");
const asyncHandler = require("../utils/asyncHandler");
const { loadVisibleProject } = require("../utils/projectAccess");

const projectActivity = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  const [approvals, comments, notifications] = await Promise.all([
    Approval.find({ project: project._id }).sort({ createdAt: -1 }),
    Comment.find({ project: project._id }).sort({ createdAt: -1 }),
    Notification.find({ project: project._id }).sort({ createdAt: -1 }).limit(50),
  ]);
  res.json({ approvals, comments, notifications });
});

const myNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({
    $or: [{ user: req.user._id }, { email: req.user.email }],
  })
    .populate("project", "title status")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications: items });
});

module.exports = { projectActivity, myNotifications };
