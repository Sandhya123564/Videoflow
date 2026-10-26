const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const ApiError = require("./utils/apiError");
const { ensureDemoUsers } = require("./utils/ensureDemoUsers");

const app = express();
app.set("trust proxy",1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

if (env.mediaPublic) {
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
}
app.use("/api/v1", routes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

async function start() {
  await connectDb();
  if (env.nodeEnv !== "production") {
    await ensureDemoUsers();
    console.log(
      "Demo users ready (Password123): admin@ head@ editor@ reviewer@videoflow.local"
    );
  }
  app.listen(env.port, () => {
    console.log(`VideoFlow API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

module.exports = app;
