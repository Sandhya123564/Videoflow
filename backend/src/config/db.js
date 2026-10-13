const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const env = require("./env");

let memoryServer;

async function startMemoryDb() {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: "videoflow" },
  });
  const memUri = memoryServer.getUri();
  await mongoose.connect(memUri);
  console.log("MongoDB connected (in-memory local mode)");
  console.log("Data is kept only while this API process is running.");
}

async function connectDb() {
  mongoose.set("strictQuery", true);

  const forceMemory =
    String(process.env.USE_MEMORY_DB || "").toLowerCase() === "true";

  if (forceMemory) {
    await startMemoryDb();
    return { mode: "memory" };
  }

  const uri = env.mongoUri;
  const looksLocal = uri.includes("127.0.0.1") || uri.includes("localhost");

  if (looksLocal) {
    try {
      await startMemoryDb();
      return { mode: "memory" };
    } catch (err) {
      console.warn("In-memory MongoDB failed:", err.message);
    }
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    console.log("MongoDB connected (persistent)");
    return { mode: "persistent" };
  } catch (err) {
    console.error("Persistent MongoDB connection failed:", err.message);
    throw new Error(
      "Could not connect to MONGODB_URI. Fix the Atlas/local URI or set USE_MEMORY_DB=true for disposable local data. Refusing to hide this behind an in-memory database."
    );
  }
}

module.exports = { connectDb };
