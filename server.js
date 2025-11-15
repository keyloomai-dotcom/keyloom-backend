const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_STYLE_SAMPLE = `Writing this in San Francisco, having just come back from San Diego and a heroin Christmas at my mother’s. Not that I used any: there was definitely no blowing, horning, tasting, fixing, goofing, getting loaded or laying out. I’ve always been afraid of serious drugs, knowing my grip on ‘things being OK’ was pretty tenuous already. Back in high school in the early 1970s, when everyone else was dropping acid, I refrained – mainly out of fear that I would be the inevitable freak with no friends who would end up curled up for life in a psychotic ball, or else spattered in ribbony pieces, having flung myself through a plate-glass window. I also wanted to get perfect grades. No: the major dissipations this holiday were candy and coffee and buying things online with just one click. Before I left, Blakey had given me some chocolate cigarettes, and at night, lying on my back under the covers with the laptop on my stomach – my mother had put me in the little upstairs room that used to be Jeff’s – I would reach over and unroll one in a smarmy, bourgeois, sugar-dazed languor. It was a heroin Christmas because I was reading the greatest book I’ve ever read: the jazz musician Art Pepper’s 1979 autobiography Straight Life: The Story of Art Pepper. It knocked my former top pick – Clarissa – right out of first place. As Art himself might say, my joint is getting big just thinking about it. I realise there may be a few lost souls who’ve never heard of him. Forget the overrated (and vapid-looking) Chet Baker. Art Pepper (1925-82) was an authentic American genius. One of the supreme alto saxophone players of all time – Charlie Parker included. A deliriously handsome lover boy in the glory days of his youth. A lifelong dope addict of truly satanic fuck-it-all grandeur. A natural writer of brazen, comic, commanding virtuosity. A proud long-term denizen of the California prison system. And now, no doubt, a tranquil, if desiccated corpse. As his third and last wife, Laurie, notes in the epilogue to Straight Life: ‘Art ... was afraid to be buried in the ground; he was afraid of the worms. But he was terrified of fire. So I had him interred in a crypt at the Hollywood Cemetery, like Rudolph Valentino. He would have enjoyed the location, the company, and that creepy word, crypt.’ If my mother – now 77, curious and freakishly adept at Internet navigation – ever Googles me and sees what I’m writing now, I doubt if she’ll be pleased. Some of my liking, I confess, arises from sheer Southern California white trash fellow feeling. Pepper was born near Los Angeles and spent most of his rackety life (as I have) on the West Coast. His father was a shipyard worker and nasty alcoholic; his mother, a dim-witted teenage bride, didn’t want him and late in her pregnancy tried to abort him by leaping off a table. For what it’s worth, my cross-eyed stepsister Lynne did something similar when she got pregnant at 16 in San Diego in 1967: made my stepsister Laura (who was ten at the time) jump off a sofa onto her stomach to make it ‘pop’. The gambit failed to produce the desired effect. Lynne had the baby in a Catholic place for unwed mothers and left it with an adoption agency. She later married Bill, a telephone installer from San Bernardino with a mammoth, Nietzsche-style moustache, and became a compulsive gambler and grocery-coupon clipper before dying of drink at 46 in 1996. Unlike Art, however, I never mastered a musical instrument. (Plinking guitar accompaniments to ‘Puff the Magic Dragon’ and ‘Love Is Blue’ – grimly laid down as puberty loomed – don’t count.) Pepper was a child prodigy. Though neglected and unloved (his parents split up and basically dumped him) he got hold of a clarinet and taught himself to play. By the age of 14 he was sitting in on clarinet and sax in jazz clubs all around LA. After a short stint in the Army – Pepper was stationed in London after D-Day – he joined the Stan Kenton Orchestra and travelled around the country as Kenton’s lead alto. You can hear one of his very first recorded solos – brief, free, characteristically ductile – three breaks in after the famous scat-singing vocal by June Christy on Kenton’s thunderous account of ‘How High the Moon’ on the recent Proper Box compilation, Bebop Spoken Here. After his first small-group recordings in the early 1950s, discerning jazz fans recognised Pepper as a post-bop player of unusual beauty, subtlety and warmth. The fact that he was white, like several other major West Coast jazz musicians, was not generally held against him. Astonishing to discover, especially given how few people outside music know much about him now, that he came second after Charlie Parker in a 1951 Down Beat readers’ poll for Best Alto Sax Player Ever. Even the most partisan Bird-fanciers acknowledged that Pepper’s tone was the most ravishing ever heard on alto. Parker received 957 votes and Art almost tagged up with 945. But things got wrenching soon enough. Having begun as an alcoholic and pothead in his teens, Pepper got hooked on heroin while on the road with Kenton’s orchestra in 1950. He had found – as he relates in his memoir – that junk was precious indeed, the only thing that made him feel ‘at peace’ with his frightening talent and the unstable world around him. I felt this peace like a kind of warmth. I could feel it start in my stomach. From the whole inside of my body I felt the tranquillity. It was so relaxing. It was so gorgeous. Sheila said: ‘Look at yourself in the mirror! Look in the mirror!’ And that’s what I’d always done: I’d stood and looked at myself in the mirror and I’d talk to myself and say how rotten I was – ‘Why do people hate you? Why are you alone? Why are you so miserable?’ I thought: ‘Oh, no! I don’t want to do that! I don’t want to spoil this feeling that’s coming up in me!’ I was afraid that if I looked in the mirror I would see it, my whole past life, and this wonderful feeling would end, but she kept saying: ‘Look at yourself! Look how beautiful you are! Look at your eyes! Look at your pupils!’ I looked in the mirror and I looked like an angel. I looked at my pupils and they were pinpoints; they were tiny, little dots. It was like looking into a whole universe of joy and happiness and contentment. In the mid-1950s Pepper was arrested numerous times on possession charges and spent more than a year in various jails and rehabilitation centres. (He inevitably used his devious charm to hoodwink the docs into thinking he had cleaned up, even though he never did: in jail he shot up all the time.) Out on parole and divorced from his first wife – she’d dumped him over the drugs – he took up with a clingy, bouffant-haired Filipina cocktail waitress called Diane, whom he married in 1957. (He wasn’t in love with her, he confesses. She was dumb and slovenly: ‘Diane – the Great Zeeeero.’ ‘I just wanted to have chicks I could ball when I wanted to ball.’) She, too, soon had a huge habit. (She became suicidal and died a few years later.) For a while Pepper still got paying gigs, and some of his best recordings – Art Pepper Plus Eleven, Modern Art, The Return of Art Pepper and the sublime Art Pepper Meets the Rhythm Section (with Miles Davis’s nonpareil late-1950s rhythm section) – were made while he was high. But after he and poor Diane started nodding out for days at a time, blissfully insensible to the strangulated yips of their miniature French poodle, Bijou, no one would hire him. He started doing solo hold-ups and boosts to keep them supplied, cruising past East LA construction sites and making off with unguarded power tools. He got caught with a condom full of dope after one of these farcical heists and, when he refused to rat on his dealer, was sent to San Quentin, where he spent five brutalising years. He was released in 1966 – middle-aged, chap-fallen, penniless and still addicted, his numerous scars and track marks supplemented with a conglomeration of scary and absurd prison tattoos. He describes these droll insigniae in a typically deadpan passage in his autobiography.`;

async function runOpenAIPass(
  prompt,
  {
    model = "gpt-5-mini",
    temperature = 0.7,          // just for logging now
    maxOutputTokens = 600,      // just for logging now
  } = {}
) {
  console.log("🧠 OpenAI pass starting", { temperature, model, maxOutputTokens });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    // 🔴 IMPORTANT: only send model + input; no temperature, no max_output_tokens
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("❌ OpenAI HTTP error in runOpenAIPass:", response.status, errText);
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log("RAW OPENAI (pipeline):", JSON.stringify(data, null, 2));

  const messageChunk = data.output?.find?.((item) => item.type === "message");

  const text =
    data.output_text ??
    messageChunk?.content?.[0]?.text ??
    "";

  return (text || "").replace(/\\n/g, "\n").trim();
}




const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",               // allow all origins (fine for now)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// make sure OPTIONS (preflight) always succeeds
app.options("*", cors());


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

app.post("/humanize", async (req, res) => {
  try {
    const text =
      req.body?.text ??
      req.body?.prompt ??
      req.body?.input ??
      "";

    // allow override but default to your sample
    const styleSample = (req.body?.styleSample || DEFAULT_STYLE_SAMPLE).trim();

    console.log("🔥 Hit /humanize (pipeline v3)", {
      length: text.length,
      hasStyleSample: !!styleSample,
    });

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Missing text to humanize",
      });
    }

    const MAX_CHARS = 5000;
    if (text.length > MAX_CHARS) {
      return res.status(413).json({
        error: `Text too long. Keep it under ${MAX_CHARS} chars.`,
      });
    }

    let current = text;

    // 🟦 PASS 1 — Light clean-up / normalization
    const pass1Prompt = `
Normalize punctuation and spacing in the following text.
Do not change the meaning or tone. Just fix obvious formatting glitches.

Text:
${current}
    `.trim();

    current = await runOpenAIPass(pass1Prompt, {
      temperature: 0.15,
      model: "gpt-5-mini",
      maxOutputTokens: 800,
    });

    // 🟩 PASS 2 — Paraphrase for fresh wording (still clear, not stiff)
    const pass2Prompt = `
Paraphrase this text while preserving the exact meaning.
Change sentence structures and word choices so it is not just light synonym swapping.
Keep it clear and readable, but do not make it stiff, formal, or academic.
Stay close to a natural, conversational writing voice.

Text:
${current}
    `.trim();

    current = await runOpenAIPass(pass2Prompt, {
      temperature: 0.8,
      model: "gpt-5-mini",
      maxOutputTokens: 900,
    });

    // 🟧 PASS 3 — Style transfer using your sample
    const pass3Prompt = `
Here is a writing sample that represents the target style:

---
${styleSample}
---

Now rewrite the following text so that it:
- Matches the looseness, rhythm, and attitude of the sample
- Uses similar sentence flow and level of detail
- Keeps the original meaning of the text being rewritten

Do NOT copy phrases directly from the sample. Imitate the voice, not the exact wording.

Text to rewrite:
${current}
    `.trim();

    current = await runOpenAIPass(pass3Prompt, {
      temperature: 0.75,
      model: "gpt-5-mini",
      maxOutputTokens: 1000,
    });

    // 🟥 PASS 4 — “Human thinking in real time” (your original big prompt)
    const pass4Prompt = `
Rewrite the following text so it reads the way an actual person might write when they are thinking through their ideas in real time.

Keep the original meaning, but let the expression sound more lived in, slightly scattered at moments, and not perfectly organized.
Allow the writing to drift a little, circle back, hesitate, or shift tone the way people naturally do when they’re figuring out what they want to say.

Use a rhythm that mixes long, loosely connected sentences with brief, abrupt ones.
Let some sentences trail slightly before picking up again.
Avoid uniformity. Avoid the kind of symmetry or clean structure that feels planned.
Include small quirks—subtle asides, imperfect transitions, a few conversational fillers when appropriate—without overdoing it.

Do not use em dashes or any long dash punctuation. Only use hyphens when required inside a single word.
Keep titles or headings in sentence case.
Avoid hyperbole, avoid stacked adjectives, and stay away from overused formal words such as “compelling,” “crucial,” “utilize,” “leverage,” “paradigm,” “cutting edge,” “in today's world,” or similar inflated phrasing.

Do not try to sound absolutely certain about complex ideas.
Use natural, low-key transitions instead of polished ones.
Let the writing feel slightly imperfect but thoughtful, as if someone is working through their thoughts rather than presenting a finalized essay.
It should not follow strict academic patterns like topic sentence → supporting details → clean wrap-up unless the original text forces it.

Do not add new facts. Do not remove important meaning. Do not summarize.
Do not comment on the original text or mention that it was rewritten.

Simply return a version of the text that feels like genuine human communication—organic, varied, a little uneven at times, and grounded in a natural, personal way of expressing the same ideas.

Here is the text to rewrite:
${current}
    `.trim();

    current = await runOpenAIPass(pass4Prompt, {
      temperature: 0.95,
      model: "gpt-5-mini",
      maxOutputTokens: 1100,
    });

    // 🟫 PASS 5 — Natural variation / warmth / human rhythm
    const pass5Prompt = `
Rewrite the following text with subtle natural variation and human warmth.

- Keep the meaning the same.
- Mix short, medium, and long sentences in a way that feels natural.
- Vary how sentences start so the openings are not repetitive.
- Add 1–3 gentle asides or internal-thought style comments where they genuinely fit.
- Blend simple wording with a few more specific or descriptive words.
- Keep everything coherent and easy to read; do not introduce slang or jokes unless the tone already supports it.

Do not add new factual content. Do not remove important ideas.

Text:
${current}
    `.trim();

    current = await runOpenAIPass(pass5Prompt, {
      temperature: 0.8,
      model: "gpt-5-mini",
      maxOutputTokens: 1000,
    });

    // 🟪 PASS 6 — Final light grammar / polish without killing the vibe
    const pass6Prompt = `
Lightly edit the following text to fix obvious grammar, spelling, and punctuation mistakes.
Do NOT make it more formal, rigid, or academic.
Preserve the human, slightly in-the-head feeling, the varied rhythm, and the small imperfections that make it feel natural.

Text:
${current}
    `.trim();

    current = await runOpenAIPass(pass6Prompt, {
      temperature: 0.25,
      model: "gpt-5-mini",
      maxOutputTokens: 900,
    });

    const cleaned = current
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log("✨ Humanized (pipeline v3) text ready.");
    return res.json({ humanizedText: cleaned });
  } catch (err) {
    console.error("❌ /humanize pipeline error:", err);
    return res.status(500).json({
      error: "Server error",
    });
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
