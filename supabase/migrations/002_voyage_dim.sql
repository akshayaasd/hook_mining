-- Migrate from OpenAI 1536-dim embeddings to Voyage AI 1024-dim.
-- Run this in Supabase SQL Editor AFTER the initial schema.sql.

-- 1. Drop dependents first
drop function if exists match_hooks(vector, real, int);

-- 2. Drop and recreate the column with new dimension
alter table posts drop column if exists hook_embedding;
alter table posts add column hook_embedding vector(1024);

-- 3. Recreate the RPC at 1024 dim
create or replace function match_hooks(
  query_embedding vector(1024),
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
