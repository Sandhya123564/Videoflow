const env = require("../config/env");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "MulterError") {
    status = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Video is larger than the 200 MB limit";
    } else {
      message = err.message;
    }
  }

  const payload = { message };

  if (err.details) {
    payload.details = err.details;
  }

  if (env.nodeEnv !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
