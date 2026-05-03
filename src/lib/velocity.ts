import { getServerClient } from "./supabase";
import { HOOK_PATTERNS } from "./patterns";
import type { PatternVelocity } from "./types";

export async function recomputeVelocity(): Promise<PatternVelocity[]> {
  const sb = getServerClient();
  const now = Date.now();
  const sevenAgo = new Date(now - 7 * 86_400_000).toISOString();
  const thirtyAgo = new Date(now - 37 * 86_400_000).toISOString();

  const { data: recent } = await sb
    .from("posts")
    .select("pattern_id, engagement")
    .gte("posted_at", sevenAgo)
    .not("pattern_id", "is", null);

  const { data: baseline } = await sb
    .from("posts")
    .select("pattern_id, engagement")
    .gte("posted_at", thirtyAgo)
    .lt("posted_at", sevenAgo)
    .not("pattern_id", "is", null);

  const recentByPattern: Record<string, { count: number; eng: number }> = {};
  const baselineByPattern: Record<string, { count: number; eng: number }> = {};
  for (const r of recent ?? []) {
    const k = r.pattern_id as string;
    recentByPattern[k] ||= { count: 0, eng: 0 };
    recentByPattern[k].count++;
    recentByPattern[k].eng += r.engagement ?? 0;
  }
  for (const r of baseline ?? []) {
    const k = r.pattern_id as string;
    baselineByPattern[k] ||= { count: 0, eng: 0 };
    baselineByPattern[k].count++;
    baselineByPattern[k].eng += r.engagement ?? 0;
  }

  const rows: PatternVelocity[] = HOOK_PATTERNS.map((p) => {
    const r = recentByPattern[p.id] ?? { count: 0, eng: 0 };
    const b = baselineByPattern[p.id] ?? { count: 0, eng: 0 };
    const baselineDailyAvg = b.count / 30 || 0.001;
    const recentDailyAvg = r.count / 7 || 0;
    const velocity = recentDailyAvg / Math.max(baselineDailyAvg, 0.05);
    let trend: PatternVelocity["trend"] = "steady";
    if (velocity > 1.4 && r.count >= 3) trend = "rising";
    else if (velocity < 0.6 && b.count >= 3) trend = "falling";
    return {
      pattern_id: p.id,
      recent_count: r.count,
      baseline_count: b.count,
      velocity: Number(velocity.toFixed(2)),
      trend,
      avg_engagement: r.count ? r.eng / r.count : 0,
    };
  });

  // Upsert
  await sb.from("pattern_velocity").upsert(
    rows.map((r) => ({
      pattern_id: r.pattern_id,
      recent_count: r.recent_count,
      baseline_count: r.baseline_count,
      velocity: r.velocity,
      trend: r.trend,
      avg_engagement: r.avg_engagement,
      updated_at: new Date().toISOString(),
    })),
  );

  return rows;
}

export async function recomputeNicheStats(): Promise<void> {
  const sb = getServerClient();
  const { data } = await sb
    .from("posts")
    .select("niche, pattern_id, engagement")
    .not("pattern_id", "is", null)
    .not("niche", "is", null);
  const cells: Record<string, { count: number; eng: number }> = {};
  for (const r of data ?? []) {
    const key = `${r.niche}::${r.pattern_id}`;
    cells[key] ||= { count: 0, eng: 0 };
    cells[key].count++;
    cells[key].eng += r.engagement ?? 0;
  }
  const rows = Object.entries(cells).map(([k, v]) => {
    const [niche, pattern_id] = k.split("::");
    return {
      niche,
      pattern_id,
      count: v.count,
      avg_engagement: v.count ? v.eng / v.count : 0,
      updated_at: new Date().toISOString(),
    };
  });
  if (rows.length === 0) return;
  await sb.from("niche_pattern_stats").upsert(rows);
}
