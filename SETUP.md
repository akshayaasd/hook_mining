# Setup checklist

You only have to fill keys + run two commands. I built everything else.

## 1. Sign up + grab keys

- [ ] **Supabase** — https://supabase.com → "New project". Region: closest to you. Name: `pixii-hooks`. Save the **Project URL**, **anon public key**, **service_role key** (Settings → API).
- [ ] **Anthropic** — already have ✓
- [ ] **OpenAI** — already have ✓
- [ ] **Ensemble Data** — already have ✓
- [ ] **Tavily** — already have ✓
- [ ] **Apify** — https://apify.com → sign up free → Settings → Integrations → API token. Free tier gives ~$5 credit/month, enough for the demo.
- [ ] **Resend** — https://resend.com → API Keys → Create. The free tier sends from `onboarding@resend.dev` (no domain verification needed). For real digest, verify a domain later.

## 2. Apply the database schema

Open Supabase → **SQL Editor** → **New query** → paste the **entire contents of `supabase/schema.sql`** → Run.

You should see "Success. No rows returned." That created:

- `posts` (the hook library)
- `hook_patterns` (the 20-pattern taxonomy)
- `brand_voices`, `generated_posts`
- `pattern_velocity`, `niche_pattern_stats`
- The `match_hooks` RPC for vector similarity
- pgvector + pg_trgm extensions

## 3. Fill `.env.local`

```bash
cp .env.example .env.local
```

Open `.env.local` and paste:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ENSEMBLE_DATA_TOKEN=...
TAVILY_API_KEY=tvly-...
APIFY_TOKEN=apify_api_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
DIGEST_FROM_EMAIL=onboarding@resend.dev
DIGEST_TO_EMAIL=your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=any-random-string-you-make-up
```

## 4. Seed real data + learn the Pixii voice + write 10 Pixii posts

```bash
npm run bootstrap
```

This single command runs end-to-end:
1. Seeds the 20-pattern taxonomy
2. Crawls 3 niches (amazon-seller, ecommerce, ai-tools) — pulls hundreds of posts
3. Classifies + embeds every hook
4. Recomputes pattern velocity + niche heatmap
5. Learns `@pixii_ai`'s brand voice from their X handle
6. Writes 10 ready-to-post Pixii posts in their voice using rising patterns

Expect ~3–5 minutes. You'll see the counts roll by.

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

Click around: `/` → `/trends` → `/library` → `/voice` → `/generate` → `/digest`. Make sure each page has data.

## 6. Push to GitHub

```bash
gh repo create pixii-hook-mining --public --source=. --remote=origin --push
```

(or use the website if you don't have `gh`).

## 7. Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

When prompted, **paste every key from `.env.local`** into Vercel's environment variables (it'll ask).

The cron in `vercel.json` triggers `/api/cron/weekly` every Monday 14:00 UTC.

## 8. Record video — see DEMO.md
