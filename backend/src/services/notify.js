const { Notification, User } = require("../models");
const env = require("../config/env");
const { deliverEmail, emailMode } = require("./emailService");

async function notify({
  email,
  user,
  type,
  title,
  body,
  project,
  reviewPath,
}) {
  const targetEmail = (email || user?.email || "").toLowerCase();
  const record = await Notification.create({
    user: user?._id || user,
    email: targetEmail,
    type,
    title,
    body,
    project: project?._id || project,
  });

  if (targetEmail) {
    const link = reviewPath
      ? `${env.clientOrigin}${reviewPath}`
      : `${env.clientOrigin}/login`;
    const result = await deliverEmail({
      to: targetEmail,
      subject: title,
      text: `${body}\n\nOpen VideoFlow: ${link}\n`,
    });
    record.deliveryMode = result.mode;
    if (result.delivered) {
      record.emailSentAt = new Date();
    }
    await record.save();
    record._delivery = result;
  }

  return record;
}

async function findHeads() {
  return User.find({ role: "head", isActive: true });
}

async function findUserByEmail(email) {
  if (!email) return null;
  return User.findOne({ email: email.toLowerCase(), isActive: true });
}

module.exports = { notify, findHeads, findUserByEmail, emailMode };
