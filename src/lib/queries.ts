import { getServerClient } from "./supabase";
import type { PatternVelocity } from "./types";

export async function getOverviewStats() {
  const sb = getServerClient();
  const sevenAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ count: total }, { count: weekly }, { count: voices }, { count: generated }] = await Promise.all([
    sb.from("posts").select("id", { count: "exact", head: true }),
    sb
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("scraped_at", sevenAgo),
    sb.from("brand_voices").select("id", { count: "exact", head: true }),
    sb.from("generated_posts").select("id", { count: "exact", head: true }),
  ]);
  return {
    total: total ?? 0,
    weekly: weekly ?? 0,
    voices: voices ?? 0,
    generated: generated ?? 0,
  };
}

export async function getRisingPatterns(limit = 5): Promise<PatternVelocity[]> {
  const sb = getServerClient();
  const { data } = await sb
    .from("pattern_velocity")
    .select("*")
    .order("velocity", { ascending: false })
    .limit(limit);
  return (data ?? []) as PatternVelocity[];
}

export async function getAllVelocity(): Promise<PatternVelocity[]> {
  const sb = getServerClient();
  const { data } = await sb.from("pattern_velocity").select("*");
  return (data ?? []) as PatternVelocity[];
}

export async function getTopHooks(limit = 9, opts?: { sinceDays?: number; pattern?: string; niche?: string; platform?: string; q?: string }) {
  const sb = getServerClient();
  const since = new Date(Date.now() - (opts?.sinceDays ?? 14) * 86_400_000).toISOString();
  let query = sb
    .from("posts")
    .select("id, hook, pattern_id, niche, platform, author_handle, url, likes, comments, shares, views, engagement, posted_at")
    .not("hook", "is", null)
    .gte("posted_at", since)
    .order("engagement", { ascending: false })
    .limit(limit);
  if (opts?.pattern) query = query.eq("pattern_id", opts.pattern);
  if (opts?.niche) query = query.eq("niche", opts.niche);
  if (opts?.platform) query = query.eq("platform", opts.platform);
  if (opts?.q) query = query.ilike("hook", `%${opts.q}%`);
  const { data } = await query;
  return data ?? [];
}

export async function getNicheStats() {
  const sb = getServerClient();
  const { data } = await sb.from("niche_pattern_stats").select("*");
  return data ?? [];
}

export async function getBrandVoices() {
  const sb = getServerClient();
  const { data } = await sb.from("brand_voices").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getGeneratedForVoice(voiceId: string, limit = 30) {
  const sb = getServerClient();
  const { data } = await sb
    .from("generated_posts")
    .select("*")
    .eq("brand_voice_id", voiceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getMostRecentVoice() {
  const sb = getServerClient();
  const { data } = await sb.from("brand_voices").select("*").order("created_at", { ascending: false }).limit(1).single();
  return data;
}
