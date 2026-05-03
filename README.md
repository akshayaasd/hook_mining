# Hook Mining Engine

> Crawl 1,000 viral posts a week. Surface the hook patterns that work. Write new posts in any brand's voice — automatically.

Built as the **Founding Engineer take-home** for [Pixii.ai](https://www.pixii.ai). Picks the *Hook Mining Engine* project from their menu and ships it as a deployed web app — not a script, not a notebook, not a chat transcript.

---

## What it does

An autonomous multi-agent pipeline:

1. **Crawler** — pulls viral posts from TikTok, Instagram, YouTube, X, Reddit, LinkedIn (6 platforms, 7 niches, engagement-thresholded).
2. **Classifier** — Claude Haiku 4.5 isolates the hook line, tags it against a 20-pattern taxonomy (Contrarian, Stat Shock, POV, Story Open, Mistake Frame, Build-in-Public, …) and labels the niche.
3. **Embedder** — Voyage AI `voyage-3.5-lite` indexes every hook in pgvector for similarity search.
4. **Trend velocity engine** — for every pattern, computes recent 7-day count vs prior 30-day baseline. Surfaces what's *gaining share-of-voice this week*, not just what's loud.
5. **Brand voice learner** — paste any X handle. We pull 40 recent posts, Claude Sonnet 4.5 distills the voice profile (tone, vocab, preferred patterns), store it as a first-class object.
6. **Writer** — combines a chosen brand voice + product context + currently-rising patterns. Claude Sonnet generates 10 ready-to-post variants, each with a one-line rationale.
7. **Weekly digest** — Resend email every Monday with the top rising patterns + best hooks + Pixii post-queue count.
8. **Cron** — Vercel cron at `0 14 * * 1` re-crawls, re-classifies, re-embeds, re-emails.

---

## Stack — 8 APIs / tools

| Layer | Service | Role |
|------|--------|------|
| LLM | **Anthropic Claude** | Haiku 4.5 for batched classification (cached system prompt). Sonnet 4.5 for voice analysis + post generation. |
| Embeddings | **Voyage AI** | `voyage-3.5-lite`, 1024-dim, free tier. |
| Scraping | **Ensemble Data** | TikTok, Instagram, YouTube, X. |
| Scraping | **Apify** | Reddit + LinkedIn (Ensemble doesn't cover them well). |
| Web search | **Tavily** | Emerging topics outside the viral feed bubble. |
| Database | **Supabase** | Postgres + pgvector + pg_trgm. |
| Email | **Resend** | Weekly digest. |
| Hosting | **Vercel** | Frontend + serverless + cron. |

The brief required 2+ APIs. We use 8 because Pixii's pitch is "manage an army of AI agents" and this is what that looks like.

---

## The pages

| Route | What it does |
|------|--------|
| `/` | Overview — stat cards, pipeline diagram, rising patterns, top hooks. |
| `/trends` | Pattern-velocity bar chart + niche × pattern heatmap + 7-day top hooks. |
| `/library` | 1,000+ hooks searchable. Filter by pattern, niche, platform. |
| `/voice` | Learned brand voices. Paste a handle, click Learn. |
| `/generate` | Pick voice + product + rising patterns → 10 ready-to-ship posts in 30 seconds. |
| `/digest` | Email preview. One click sends to your inbox. |

---

## Run it

### 1. Install

```bash
npm install --legacy-peer-deps
```

### 2. Provision Supabase

- Sign up at https://supabase.com → new project (Free tier).
- SQL Editor → paste `supabase/schema.sql` → Run.
- SQL Editor → paste `supabase/migrations/002_voyage_dim.sql` → Run.
- Settings → API → copy **Project URL**, **publishable** key, **secret** key.

### 3. Get the other API keys

- **Anthropic** — https://console.anthropic.com
- **Voyage AI** — https://www.voyageai.com (free, no card)
- **Ensemble Data** — https://ensembledata.com
- **Apify** — https://apify.com (free $5/mo credit)
- **Tavily** — https://tavily.com
- **Resend** — https://resend.com (free tier — uses `onboarding@resend.dev` until you verify a domain)

### 4. Fill `.env.local`

```bash
cp .env.example .env.local
# then paste keys into .env.local
```

### 5. Verify keys

```bash
npm run test:keys
```

Should print 7 ✓ greens.

### 6. Pre-flight (≈ $0.01)

```bash
npm run preflight
```

Smokes the full pipeline against mock data. 6 ✓ greens before any real scraping spend.

### 7. Real ingest (≈ $0.10)

```bash
npm run smoke           # 1 niche, 5 posts/source — confirms pipeline lands rows
npm run finish          # learn a brand voice + generate 10 Pixii posts
```

Or do everything in one go (≈ $0.50):

```bash
npm run bootstrap
```

### 8. Verify

```bash
npm run verify          # read-only DB inspector — counts, embedding coverage, FK orphans
```

### 9. Run the app

```bash
npm run dev             # serves on http://localhost:3001
```

### 10. Deploy

```bash
vercel --prod
```

When prompted, paste every key from `.env.local` into Vercel's environment variables.

---

## Architecture

```
src/
  app/                  Next.js 15 App Router
    page.tsx            Overview
    trends/             Velocity chart + heatmap
    library/            Filterable hook library
    voice/              Brand voice learner UI
    generate/           Generator UI
    digest/             Email preview
    api/
      ingest/           POST: trigger one niche (CRON_SECRET-gated)
      voice/            POST: learn brand voice
      generate/         POST: write posts
      digest/           GET: HTML preview
      digest/send/      POST: send via Resend
      cron/weekly/      GET: weekly cron entrypoint
  lib/
    types.ts            Shared contracts
    patterns.ts         20-pattern taxonomy
    anthropic.ts openai.ts voyage.ts ensemble.ts apify.ts tavily.ts resend.ts supabase.ts
    classify.ts         Hook + pattern + niche, batched, FK-validated
    embed.ts            pgvector RPC wrapper
    velocity.ts         7d/30d trend math + niche stats
    voice.ts            Brand-voice analyst + dormant-handle fallback
    generate.ts         Writer prompt; mixes patterns; persists
    digest.ts           Weekly email render + send
    ingest.ts           Crawl → classify → dedupe → upsert → embed → recompute
    queries.ts          Server-component data layer
  components/           nav, hook-card, velocity-chart, niche-heatmap, stat-card, ui/*
scripts/                CLI: preflight, smoke, verify, bootstrap, finish, ingest, classify, embed, voice, test-keys
supabase/
  schema.sql            Initial schema (pgvector + trgm + match_hooks RPC)
  migrations/
    002_voyage_dim.sql  1536→1024 dim migration for Voyage
```

---

## Why this design

Two engineering decisions that mattered:

**Velocity, not volume.** A "top hooks" leaderboard is a stale snapshot. Founders care which hooks are *gaining share-of-voice this week*. So every pattern carries a 7-day-vs-30-day-baseline ratio. Cheap to compute. The only thing worth opening the dashboard for.

**Brand voice as a first-class object.** Generic viral-post generators write the same five posts every brand has already seen. Learning the voice from a public handle (and storing it) gives the writer agent a real grounding signal. It also mirrors Pixii's own product philosophy — Brand Profile is the feature their customers love most. Mine learns the *words*; theirs learns the *look*.

---

## What I'd add with two more days

- Chrome extension that classifies any post you hover.
- Buffer / Typefully integration so the generator publishes directly.
- Per-pattern hook-similarity search ("find me three more hooks like this winning one") on top of the existing pgvector RPC.
- Auto-discovery of new patterns from posts that no taxonomy entry classifies confidently.

---

## License

MIT.
