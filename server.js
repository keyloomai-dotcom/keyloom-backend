require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Needed so we can read the raw body for signature verification
app.use(bodyParser.raw({ type: "application/json" }));

app.post("/webhook", (req, res) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(
    hmac.update(req.body).digest("hex"),
    "utf8"
  );
  const signature = Buffer.from(req.get("X-Signature"), "utf8");

  if (!crypto.timingSafeEqual(digest, signature)) {
    console.log("❌ Invalid signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());
  console.log("✅ Received webhook:", event.meta.event_name);

  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
