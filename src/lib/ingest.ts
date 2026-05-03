import { classifyBatch } from "./classify";
import { scrapeNiche } from "./ensemble";
import { scrapeReddit, scrapeLinkedIn } from "./apify";
import { embedHooks } from "./embed";
import { PATTERN_BY_ID } from "./patterns";
import { getServerClient } from "./supabase";
import { recomputeNicheStats, recomputeVelocity } from "./velocity";
import type { Niche, RawPost } from "./types";

export interface IngestResult {
  scraped: number;
  classified: number;
  inserted: number;
  embedded: number;
  niche: Niche;
}

const REDDIT_FOR_NICHE: Record<Niche, string[]> = {
  "amazon-seller": ["AmazonSeller", "FulfillmentByAmazon", "amazonsellercentral"],
  ecommerce: ["ecommerce", "shopify"],
  "ai-tools": ["LocalLLaMA", "AI_Agents", "ChatGPT"],
  dtc: ["ecommerce", "marketing"],
  "creator-economy": ["NewTubers", "Twitch"],
  saas: ["SaaS", "startups"],
  general: ["Entrepreneur", "marketing"],
};

const LINKEDIN_FOR_NICHE: Record<Niche, string[]> = {
  "amazon-seller": ["amazon seller growth", "amazon listing tips"],
  ecommerce: ["dtc brand strategy", "shopify CRO"],
  "ai-tools": ["AI agents launch", "AI startup founder"],
  dtc: ["dtc founder lessons"],
  "creator-economy": ["creator personal brand"],
  saas: ["B2B SaaS founder lessons"],
  general: ["startup growth"],
};

export async function ingestNiche(niche: Niche, opts?: { perSource?: number; classify?: boolean }): Promise<IngestResult> {
  const perSource = opts?.perSource ?? 30;
  const classify = opts?.classify ?? true;
  const sb = getServerClient();
  const runRow = await sb.from("ingest_runs").insert({ source: "all", niche }).select().single();
  const runId = runRow.data?.id as string | undefined;

  const ensemblePosts = await scrapeNiche(niche, { perSourceLimit: perSource }).catch(() => []);
  const redditPosts = await scrapeReddit(REDDIT_FOR_NICHE[niche] ?? [], perSource).catch(() => []);
  const linkedinPosts = await scrapeLinkedIn(LINKEDIN_FOR_NICHE[niche] ?? [], Math.floor(perSource / 2)).catch(() => []);

  const all: RawPost[] = [...ensemblePosts, ...redditPosts, ...linkedinPosts]
    .map((p) => ({ ...p, niche }))
    .filter((p) => p.content && p.content.length > 12)
    // Engagement-aware filter — keep posts above a per-platform floor
    .filter((p) => {
      if (p.platform === "tiktok") return (p.views ?? 0) > 5_000 || p.likes > 500;
      if (p.platform === "instagram") return p.likes > 200;
      if (p.platform === "youtube") return (p.views ?? 0) > 2_000;
      if (p.platform === "twitter") return p.likes > 30 || p.shares > 5;
      if (p.platform === "linkedin") return p.likes > 50;
      if (p.platform === "reddit") return p.likes > 25;
      return true;
    });

  const classified = classify ? await classifyBatch(all) : [];

  let inserted = 0;
  let embeddedCount = 0;
  if (classified.length > 0) {
    // Dedupe by (platform, source_id) — same TikTok can come back across multiple keywords
    const seen = new Set<string>();
    const dedup = classified
      .filter((c) => {
        // Defense in depth — only accept rows whose pattern_id exists in the taxonomy
        if (!PATTERN_BY_ID[c.pattern_id]) return false;
        const k = `${c.platform}::${c.source_id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    const upsertRows = dedup.map((c) => ({
      platform: c.platform,
      source_id: c.source_id,
      url: c.url,
      author_handle: c.author_handle,
      author_name: c.author_name,
      content: c.content,
      hook: c.hook,
      pattern_id: c.pattern_id,
      pattern_confidence: c.pattern_confidence,
      niche: c.niche,
      posted_at: c.posted_at,
      likes: c.likes,
      comments: c.comments,
      shares: c.shares,
      views: c.views,
      raw: c.raw as Record<string, unknown> | null,
    }));
    const { data, error } = await sb
      .from("posts")
      .upsert(upsertRows, { onConflict: "platform,source_id", ignoreDuplicates: false })
      .select("id, hook");
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[ingest upsert]", error.message);
    } else {
      inserted = data?.length ?? 0;
      // Embed only freshly upserted hooks
      const targets = (data ?? []).filter((r) => r.hook).map((r) => ({ id: r.id as string, hook: r.hook as string }));
      await embedHooks(targets);
      embeddedCount = targets.length;
    }
  }

  await recomputeVelocity().catch(() => null);
  await recomputeNicheStats().catch(() => null);

  if (runId) {
    await sb
      .from("ingest_runs")
      .update({
        posts_in: all.length,
        posts_classified: classified.length,
        posts_embedded: embeddedCount,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return {
    scraped: all.length,
    classified: classified.length,
    inserted,
    embedded: embeddedCount,
    niche,
  };
}
