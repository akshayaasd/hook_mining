# 3-minute demo script

**Camera ON the whole time.** Camera-off submissions get disqualified.

## Cold open (0:00 – 0:20)

> "Hi, I'm Akshayaa. I built the **Hook Mining Engine** for Pixii. The brief said: crawl 1,000 viral posts a week, surface emerging hook patterns, write posts for Pixii. So I built the loop end-to-end."

Show your face full-frame. Smile. Then cut to screen-share.

## Required intro details (0:20 – 0:40)

> "I'm Akshayaa — [school name], CGPA [your CGPA]. Favourite accomplishment: [your one-liner — pick something specific, e.g. 'shipped a Telegram bot used by 4,000 traders' or 'top 0.5% on Kaggle X comp']."

Keep this tight. Don't drift.

## Demo — user perspective, NOT code (0:40 – 2:20)

Show the deployed app. Walk through it the way a Pixii growth lead would actually use it:

1. **`/` overview** — "Here's what mining looks like. 1,200+ hooks indexed across 6 platforms, 280 mined this week, 4 brand voices learned, 47 posts generated."
2. **`/trends`** — "This week, the Stat Shock pattern is up 84% vs its 30-day baseline. Mistake Frame is up 60%. Listicles are flat. Heatmap shows Stat Shock is dominant for Amazon sellers but weak for AI tools, where Build-in-Public is winning."
3. **`/library`** — Filter by `Stat Shock` + `amazon-seller`. "Here's what's actually working. Real posts, real engagement numbers, deep links."
4. **`/voice`** — "I learned `@pixii_ai`'s voice — 40 posts in, Claude Sonnet wrote a profile. Tone, vocab, the patterns Pixii already uses."
5. **`/generate`** — "Pick the voice. The product context is pre-filled with Pixii's positioning. The patterns are pre-selected to match what's rising. One click — 10 posts in 30 seconds, each with a one-line rationale of why this pattern fits this product right now."
6. **`/digest`** — "Every Monday at 2 PM UTC, Vercel cron re-crawls, re-classifies, and emails this digest. Rising patterns up top. Top hooks below. Pixii post queue count at the bottom."

## Why I designed it this way (2:20 – 2:40)

> "Two decisions that mattered. **Velocity, not volume** — a top-hooks leaderboard is a stale snapshot. Founders care which hooks are *gaining share-of-voice this week*. So I compute 7-day count vs 30-day baseline per pattern. Cheap to compute. Only thing worth opening the dashboard for. **Brand voice as a first-class object** — generic viral generators write the same five posts every brand has seen. Learning the voice from a public handle gives the writer agent a real grounding signal. It also mirrors Pixii's own product — Brand Profile is the feature your customers love most."

## Tools / APIs used (2:40 – 2:55)

> "Eight: Anthropic Claude — Haiku 4.5 for classification with prompt caching, Sonnet 4.6 for voice analysis and writing. OpenAI text-embedding-3-small for the pgvector index. Ensemble Data for TikTok, Instagram, YouTube, X. Apify for Reddit and LinkedIn. Tavily for emerging topics outside the viral feed. Supabase for Postgres + pgvector. Resend for the digest email. Vercel for hosting and cron."

## If I had more time (2:55 – 3:00)

> "Chrome extension that classifies any post you hover. Buffer/Typefully publish-direct. Per-pattern hook similarity search on top of the existing pgvector RPC."

End with face full-frame: "Thanks. Excited to talk."

---

## Recording tips

- **Loom** or **Cleanshot Cloud** for screen + camera — picture-in-picture top-right.
- Resolution **1080p**. Don't go 4K (file too big).
- Single take. Re-record fully if you mess up — splices look amateur.
- Clean desktop. Close Slack/Discord notifications.
- Keep camera on through whole video. **Don't cut to fullscreen demo — keep face overlay**.
- Pre-load all pages in tabs so demo doesn't dawdle.
- Practice the demo flow 2–3 times before recording.

## What NOT to do

- Don't read your code aloud. They said "user perspective."
- Don't apologize ("sorry the data is small…"). State value, not caveats.
- Don't go over 3:00. They explicitly said: "test of your ability to prioritize."
