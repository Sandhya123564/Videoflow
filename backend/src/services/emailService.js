const fs = require("fs");
const path = require("path");
const env = require("../config/env");

const logFile = path.join(__dirname, "../../emails.log");

function emailMode() {
  return env.resend.apiKey ? "resend" : "testing";
}

function isTestingMode() {
  return emailMode() === "testing";
}

async function deliverEmail({ to, subject, text }) {
  const block = [
    "========== VideoFlow email ==========",
    `mode: ${emailMode()}`,
    `time: ${new Date().toISOString()}`,
    `to: ${to}`,
    `subject: ${subject}`,
    text,
    "=====================================",
    "",
  ].join("\n");

  console.log(block);
  try {
    fs.appendFileSync(logFile, block);
  } catch (err) {
    console.warn("Could not write emails.log:", err.message);
  }

  if (!env.resend.apiKey) {
    return {
      delivered: false,
      mode: "testing",
      message:
        "EMAIL TESTING MODE: Resend is not configured. This message was written to the API terminal and backend/emails.log. It was not sent to an inbox.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.resend.from,
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn("Resend failed:", res.status, body);
      return { delivered: false, mode: "resend-error", message: body.slice(0, 300) };
    }
    return { delivered: true, mode: "resend" };
  } catch (err) {
    console.warn("Resend request failed:", err.message);
    return { delivered: false, mode: "resend-error", message: err.message };
  }
}

module.exports = { deliverEmail, logFile, emailMode, isTestingMode };
