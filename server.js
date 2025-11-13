const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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

app.post("/api/generate", async (req, res) => {
  try {
    // Accept flexible field names (Codex sometimes renames them)
    const prompt =
      req.body?.prompt ??
      req.body?.text ??
      req.body?.input ??
      "";

    console.log("🔥 Hit /api/generate", {
      bodySentFromExtension: req.body,
      prompt,
      promptLength: prompt.length,
    });

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        input: prompt,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("OpenAI HTTP error:", response.status, errText);
      return res.status(500).json({ error: "OpenAI request failed" });
    }

    const data = await response.json();

    console.log("RAW OPENAI:", JSON.stringify(data, null, 2));

    const messageChunk = data.output?.find?.((item) => item.type === "message");

    const text =
      data.output_text ??
      messageChunk?.content?.[0]?.text ??
      "";

    console.log("TEXT SENT TO CLIENT FROM /api/generate:", text);
    console.log("✨ Success — sending response to extension.");

    return res.status(200).json({ text });
  } catch (err) {
    console.error("❌ Server error in /api/generate:", err);
    return res.status(500).json({ error: "Server error" });
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


app.post("/auth/google/callback", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    console.log("🔥 Hit /auth/google/callback", { code, redirectUri });

    if (!code || !redirectUri) {
      return res.status(400).json({ error: "Missing code or redirectUri" });
    }

    // 1) Exchange the code for Google tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Google token error:", tokenData);
      return res.status(500).json({ error: "Google token exchange failed" });
    }

    // 2) Get user info
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const user = await userRes.json();

// 3) Create a JWT for the extension to use
const payload = {
  sub: user.sub,          // Google user ID
  email: user.email,
  name: user.name,
};

const token = jwt.sign(payload, process.env.SESSION_SECRET, {
  expiresIn: "7d",        // 7 days token, fine for now
});

// TODO later: look up real plan in DB or subscriptions Map
const isActive = true;     // temporary: treat everyone as active
const planName = "Dev";    // temporary plan name

// This shape is what the extension expects
return res.json({
  token,          // or sessionToken if your friend wired it that way
  email: user.email,
  isActive,
  planName,
});

 

} catch (err) {
    console.error("Error in /auth/google/callback:", err);
    return res.status(500).json({ error: "Server error" });
}
});





app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
