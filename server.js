require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const LS_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

// --- Webhook MUST read the raw body (put before any JSON middleware)
app.post("/lemonsqueezy/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const digest = crypto.createHmac("sha256", LS_SECRET).update(req.body).digest("hex");
    if (digest !== signature) return res.status(400).send("Invalid signature");

    const payload = JSON.parse(req.body.toString("utf8"));
    const event = payload?.meta?.event_name;
    const email = payload?.data?.attributes?.user_email;

    console.log("✅ Lemon Squeezy event:", event, "for", email);
    // TODO: mark user active/inactive in your DB based on event/status

    res.json({ received: true });
  } catch (e) {
    console.error("Webhook error:", e.message);
    res.status(400).send("Webhook error");
  }
});

// Simple health route
app.get("/", (_req, res) => res.send("✅ Backend is running with Lemon Squeezy!"));

// (if you later add app.use(express.json()), put it AFTER the webhook route above)
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
