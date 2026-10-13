const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { connectDb } = require("../config/db");
const { ensureDemoUsers } = require("./ensureDemoUsers");

async function seed() {
  await connectDb();
  await ensureDemoUsers();
  console.log("\nDemo password for all seeded users: Password123");
  console.log("If you used in-memory MongoDB, run seed is not needed — the API seeds on boot.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
