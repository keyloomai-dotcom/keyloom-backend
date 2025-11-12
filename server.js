const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Webhook route (for Lemon Squeezy)
app.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const sig = req.get("X-Signature");
  const digest = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

  if (digest !== sig) {
    console.log("❌ Invalid signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString("utf8"));
  console.log("✅ Webhook received:", event?.meta?.event_name);
  res.send("OK");
});

// ✅ Simple homepage route
app.get("/", (_req, res) => {
  res.send("✅ Keyloom backend is live");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
