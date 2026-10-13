const { Notification } = require("../models");
const asyncHandler = require("../utils/asyncHandler");

const listMine = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user._id }, { email: req.user.email }],
  })
    .populate("project", "title status")
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({ notifications, unreadCount });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { $or: [{ user: req.user._id }, { email: req.user.email }], read: false },
    { read: true }
  );
  res.json({ ok: true });
});

const markRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      $or: [{ user: req.user._id }, { email: req.user.email }],
    },
    { read: true },
    { new: true }
  );
  res.json({ notification: item });
});

module.exports = { listMine, markRead, markAllRead };
