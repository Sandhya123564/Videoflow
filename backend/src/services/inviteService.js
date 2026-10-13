const { Invite, User } = require("../models");
const env = require("../config/env");
const { createReviewToken } = require("../utils/tokens");
const { notify } = require("./notify");

async function createInvite({ email, role, project, invitedBy, registerPath }) {
  const existingUser = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (existingUser) {
    return { existingUser, invite: null, raw: null };
  }

  const token = createReviewToken();
  const invite = await Invite.create({
    email: email.toLowerCase(),
    role: role || "reviewer",
    project: project?._id || project,
    invitedBy: invitedBy?._id || invitedBy,
    tokenHash: token.hash,
    expiresAt: new Date(Date.now() + env.inviteDays * 24 * 60 * 60 * 1000),
  });

  const path = registerPath || `/register?invite=${token.raw}`;
  await notify({
    email: email.toLowerCase(),
    type: "user_invite",
    title: project
      ? `You're invited to review: ${project.title}`
      : "You're invited to VideoFlow",
    body: project
      ? `Create your reviewer account to open "${project.title}".\nUse this exact email: ${email}`
      : `Create your ${role} account with this exact email: ${email}`,
    project,
    reviewPath: path,
  });

  return { existingUser: null, invite, raw: token.raw };
}

module.exports = { createInvite };
