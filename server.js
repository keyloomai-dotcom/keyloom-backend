const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
/** ─────────────────────────────────────────────────────────────
 * TEMP “DB”: in-memory map of email → active (true/false)
 * (Good for testing. For production, use a real DB later.)
 * ────────────────────────────────────────────────────────────*/
const subscriptions = new Map();

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.SESSION_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

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


app.post("/auth/dev-login", (req, res) => {
  const email = req.body?.email;
  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  const token = jwt.sign({ email }, process.env.SESSION_SECRET, {
    expiresIn: "60m",
  });

  res.json({ token });
});


app.post("/api/generate", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("OpenAI HTTP error:", response.status, errText);
      return res.status(500).json({ error: "OpenAI request failed" });
    }

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content?.trim() || "";

    if (!text) {
      console.error("OpenAI format error:", data);
      return res.status(500).json({ error: "OpenAI response format error" });
    }

    // This is exactly what the extension needs:
    res.json({ text });
  } catch (err) {
    console.error("Server error in /api/generate:", err);
    res.status(500).json({ error: "Server error" });
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
