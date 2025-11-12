const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

/** ─────────────────────────────────────────────────────────────
 * TEMP “DB”: in-memory map of email → active (true/false)
 * (Good for testing. For production, use a real DB later.)
 * ────────────────────────────────────────────────────────────*/
const subscriptions = new Map();

/** ─────────────────────────────────────────────────────────────
 *  Webhook from Lemon Squeezy
 *  Must use raw body for signature verification.
 * ────────────────────────────────────────────────────────────*/
app.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const sig = req.get("X-Signature");
    const digest = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

    if (digest !== sig) {
      console.log("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const name = event?.meta?.event_name;
    console.log("✅ Webhook received:", name);

    // Try to find an email on the payload (adjust as needed)
    const email =
      event?.data?.attributes?.user_email ||
      event?.data?.attributes?.email ||
      event?.meta?.custom?.email ||
      null;

    // Decide active/inactive from event type
    const activeEvents = new Set([
      "subscription_created",
      "subscription_updated",
      "subscription_resumed",
      "subscription_unpaused"
    ]);
    const inactiveEvents = new Set([
      "subscription_cancelled",
      "subscription_expired",
      "subscription_paused"
    ]);

    if (email) {
      if (activeEvents.has(name)) subscriptions.set(email, true);
      if (inactiveEvents.has(name)) subscriptions.set(email, false);
      console.log("💾 Saved:", email, "→", subscriptions.get(email));
    } else {
      console.log("ℹ️  No email found on webhook; skipping save.");
    }

    res.send("OK");
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

/** ─────────────────────────────────────────────────────────────
 * Verify endpoint (frontend calls this)
 * GET /verify?email=someone@example.com  → { email, active }
 * ────────────────────────────────────────────────────────────*/
app.get("/verify", (req, res) => {
  const email = (req.query.email || "").toLowerCase().trim();
  const active = subscriptions.get(email) || false;
  res.json({ email, active });
});

/** ─────────────────────────────────────────────────────────────
 * Health route
 * ────────────────────────────────────────────────────────────*/
app.get("/", (_req, res) => res.send("✅ Keyloom backend is live"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
