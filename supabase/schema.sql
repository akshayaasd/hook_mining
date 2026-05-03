-- Pixii Hook Mining Engine — Supabase schema
-- Run in Supabase SQL editor.

create extension if not exists vector;
create extension if not exists pg_trgm;

-- Hook patterns taxonomy (seeded by code)
create table if not exists hook_patterns (
  id text primary key,
  name text not null,
  emoji text,
  description text not null,
  examples jsonb default '[]'::jsonb
);

-- Raw scraped + classified posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  source_id text not null,
  url text not null,
  author_handle text not null,
  author_name text,
  content text not null,
  hook text,
  pattern_id text references hook_patterns(id),
  pattern_confidence real,
  niche text,
  posted_at timestamptz not null,
  scraped_at timestamptz not null default now(),
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  views integer,
  engagement integer generated always as (coalesce(likes,0) + coalesce(comments,0)*3 + coalesce(shares,0)*5) stored,
  hook_embedding vector(1536),
  raw jsonb,
  unique (platform, source_id)
);

create index if not exists posts_platform_idx on posts(platform);
create index if not exists posts_pattern_idx on posts(pattern_id);
create index if not exists posts_niche_idx on posts(niche);
create index if not exists posts_posted_at_idx on posts(posted_at desc);
create index if not exists posts_engagement_idx on posts(engagement desc);
create index if not exists posts_hook_trgm_idx on posts using gin (hook gin_trgm_ops);

-- Brand voices learned from public handles
create table if not exists brand_voices (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  platform text not null,
  voice_summary text not null,
  preferred_patterns jsonb default '[]'::jsonb,
  vocab_signals jsonb default '[]'::jsonb,
  sample_posts jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique (handle, platform)
);

-- Generated posts for a brand voice
create table if not exists generated_posts (
  id uuid primary key default gen_random_uuid(),
  brand_voice_id uuid references brand_voices(id) on delete cascade,
  pattern_id text references hook_patterns(id),
  hook text not null,
  body text not null,
  cta text,
  product_context text,
  rationale text,
  created_at timestamptz default now()
);

create index if not exists generated_posts_voice_idx on generated_posts(brand_voice_id, created_at desc);

-- Pre-aggregated pattern velocity (refreshed by job)
create table if not exists pattern_velocity (
  pattern_id text primary key references hook_patterns(id),
  recent_count integer default 0,
  baseline_count integer default 0,
  velocity real default 0,
  trend text default 'steady',
  avg_engagement real default 0,
  updated_at timestamptz default now()
);

-- Niche × pattern heatmap cell counts
create table if not exists niche_pattern_stats (
  niche text not null,
  pattern_id text not null references hook_patterns(id),
  count integer default 0,
  avg_engagement real default 0,
  updated_at timestamptz default now(),
  primary key (niche, pattern_id)
);

-- KV for ingest run logs
create table if not exists ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  niche text,
  posts_in integer default 0,
  posts_classified integer default 0,
  posts_embedded integer default 0,
  started_at timestamptz default now(),
  finished_at timestamptz,
  error text
);

-- Vector similarity RPC
create or replace function match_hooks(
  query_embedding vector(1536),
  match_threshold real default 0.6,
  match_count int default 20
) returns table (
  id uuid,
  hook text,
  pattern_id text,
  niche text,
  engagement integer,
  similarity real
) language sql stable as $$
  select p.id, p.hook, p.pattern_id, p.niche, p.engagement,
         1 - (p.hook_embedding <=> query_embedding) as similarity
  from posts p
  where p.hook_embedding is not null
    and 1 - (p.hook_embedding <=> query_embedding) > match_threshold
  order by p.hook_embedding <=> query_embedding
  limit match_count;
$$;
