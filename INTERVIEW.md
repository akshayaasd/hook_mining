# Interview prep — talking points

You're a Python backend engineer who shipped a TypeScript web app in 2 days using Claude. **Lean into that.** It's the strongest founder-engineer signal you can give Pixii.

## The opening narrative — memorize this

> "I'm a Python backend engineer. For this project I picked Next.js + TypeScript because shipping a polished, deployable web demo in 48 hours needed it. I designed the pipeline, the prompts, the hook taxonomy, the trend-velocity formula, the brand-voice abstraction, and the schema. I used Claude Code as a pair-programmer — it wrote the React/JSX plumbing and the Tailwind classes, I owned everything that mattered. That's exactly the agent-leverage workflow your team is hiring for."

Pause. Let it land.

## The system in one breath

> "Crawl → classify → embed → velocity → write. Six platforms feed in via Ensemble Data and Apify. Claude Haiku does batched classification against a 20-pattern taxonomy with a cached system prompt. OpenAI embeds every hook into pgvector. Velocity = recent 7-day count over 30-day baseline per pattern, and surfaces rising. Brand voice is learned per handle by Claude Sonnet from 40 sample posts. The writer combines voice + product + rising patterns into 10 posts. Vercel cron runs the full loop weekly."

## Likely questions + how to answer

### Why this project from the menu?

> "The brief literally said 'writes posts for Pixii.' That meant I should ship something Pixii's growth team actually uses on day one. Photo upgrader and AEO diagnostic are interesting, but they're tools. Hook Mining is the growth engine. If you hire me, I want my first PR to ship value, not a nice demo."

### How does the classifier work?

Open `src/lib/classify.ts`. It's mostly English.

> "Batches of 12 posts go to Claude Haiku 4.5. The system prompt is cached — it contains the 20-pattern taxonomy and the niche list. I cap each post at 600 chars. The model returns a JSON array, one object per input, in order. I validate pattern_id, drop anything tagged 'skip,' and clamp the hook to 200 chars. Haiku is cheap and fast — about $0.80 per thousand posts."

### Why the 20-pattern taxonomy?

> "I started with 30, collapsed to 20 after looking at real X data. They cover what I see across Amazon-seller, AI-tools, and DTC niches. It's not a perfect ontology — it's a working one. The right move for v2 is to mine new patterns from posts that no taxonomy entry classifies confidently."

### Why Haiku for classify and Sonnet for generate?

> "Cost vs quality. Classification is structured pattern-matching — Haiku 4.5 is plenty. Generation is tone-sensitive prose in a learned voice — Sonnet wins on quality and the marginal cost is fine because you're writing 10 posts, not classifying 10,000."

### Why pgvector instead of a vector DB?

> "Two reasons. One: the dataset is small enough — tens of thousands of hooks, not millions — that Postgres with HNSW or even brute-force cosine is fast. Two: keeping the embeddings next to the row means I can join `posts.engagement` on a similarity query without crossing a network boundary. If we hit 10M hooks I'd reconsider."

### Why Ensemble + Apify, not just one?

> "Ensemble is purpose-built for TikTok, Instagram, X, YouTube. Apify is broader and has the actors I need for Reddit and LinkedIn that Ensemble doesn't cover well. I treat them as composable scrapers behind a unified `RawPost` interface. Adding a new platform is one file."

### How does brand voice work?

> "Pull 40 recent posts from a public handle via Ensemble. Send to Claude Sonnet with an analyst prompt that returns three things: a 2–4 sentence voice summary, a list of preferred patterns the author actually uses, and vocab signals — phrases they repeat. That all becomes the system prompt for the writer. Mirrors what Pixii does with Brand Profile — your customers paste a handle and the product learns the look. Mine learns the words."

### What if Ensemble's API changes?

> "Each scraper is one file, one function, returns RawPost. The pipeline doesn't know which source posts came from until it reads the `platform` field. Swapping a scraper is a one-file change."

### What would you do if you joined Pixii on day one?

> "I'd ship this — get the digest into your inbox by next Monday and let it inform your X queue. Then I'd extend it to write captions for the 7 visuals Pixii already generates per ASIN. The same agent stack, fed different context, becomes the copy layer of your product."

### What did Claude write vs you?

> "Claude wrote the React components, the Tailwind classes, the chart wiring, and most of the UI plumbing. I wrote the system prompts, the schema, the velocity formula, the ingest pipeline shape, and the design decisions about what not to build. The prompts file `src/lib/patterns.ts` and the system prompts inside `classify.ts` and `generate.ts` are 80% mine — and that's where the IP is."

### Have you used TypeScript before this?

> "Read it, didn't write it day-to-day. I've shipped Python services for X years. For this project Claude wrote 90% of the TypeScript syntax — types, JSX, hooks. I wrote, debugged, and ship-checked everything. If you'd rather I commit in Python, my first refactor would move the agent core to FastAPI with the same prompts. The pipeline isn't language-bound."

### What's the one thing you'd cut?

> "The niche heatmap is pretty but probably not actionable. If it didn't already exist, I wouldn't add it. The velocity chart is the only chart that earns its pixels."

### What's broken / what would scare you in production?

> "Three things. (1) Ensemble + Apify rate limits — I should add a token bucket. (2) The classifier returns JSON in plain text — if the model drifts I drop the batch. I'd switch to tool-use for guaranteed schema. (3) No deduplication on near-identical hooks across sources — same TikTok reposted as Reel = two rows. Embedding similarity with a 0.95 threshold would fix it."

## Things you should NOT say

- "I used Claude" without saying *what you owned*. Always pair the two.
- "It's just a take-home." Never. It's the artifact you're being hired on.
- "I'd love to learn TypeScript on the job." That sounds like a junior. Say what you ALREADY did.

## If they ask why Python isn't a problem

> "The job is shipping AI products. Half the surface area is prompts and product judgment, both language-agnostic. The other half is plumbing — and plumbing is exactly what AI assistants now do well. I'd rather be the engineer who designs the agent system and uses Claude to ship faster than the one who hand-writes a useEffect."

## Closing line

> "I think Pixii is one of the few products where the design quality of the AI matches the design quality of the brand. That's rare. I'd love to come help scale it."
