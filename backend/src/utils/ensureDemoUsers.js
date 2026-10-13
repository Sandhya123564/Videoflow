const { User } = require("../models");

const DEMO = [
  { name: "Asha Admin", email: "admin@videoflow.local", role: "admin" },
  { name: "Hari Head", email: "head@videoflow.local", role: "head" },
  { name: "Eden Editor", email: "editor@videoflow.local", role: "editor" },
  { name: "Riya Reviewer", email: "reviewer@videoflow.local", role: "reviewer" },
];

async function ensureDemoUsers() {
  const passwordHash = await User.hashPassword("Password123");
  for (const row of DEMO) {
    const existing = await User.findOne({ email: row.email });
    if (!existing) {
      await User.create({ ...row, passwordHash, emailVerified: true });
    } else if (!existing.emailVerified) {
      existing.emailVerified = true;
      existing.passwordHash = passwordHash;
      await existing.save();
    }
  }
}

module.exports = { ensureDemoUsers, DEMO };
