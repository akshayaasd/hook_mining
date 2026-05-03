import "./_env";
import { classifyBatch } from "@/lib/classify";
import { embedHooks } from "@/lib/embed";
import { getServerClient } from "@/lib/supabase";
import { recomputeNicheStats, recomputeVelocity } from "@/lib/velocity";
import { HOOK_PATTERNS } from "@/lib/patterns";
import type { RawPost } from "@/lib/types";

// 5 real-but-fake posts. No scraping. Costs:
//   - Anthropic Haiku: 1 batch ≈ $0.005
//   - Voyage:          5 embeddings ≈ free
//   - Supabase:        free tier
const MOCKS: RawPost[] = [
  {
    platform: "twitter",
    source_id: "preflight-1",
    url: "https://x.com/preflight/status/1",
    author_handle: "preflight",
    author_name: "Preflight",
    content: "97% of Amazon listings are leaving money on the table. Here are the 3 image moves that 10x'd CTR for our agency clients.",
    posted_at: new Date().toISOString(),
    likes: 540, comments: 22, shares: 18, views: null,
    niche: "amazon-seller",
  },
  {
    platform: "twitter",
    source_id: "preflight-2",
    url: "https://x.com/preflight/status/2",
    author_handle: "preflight",
    content: "Stop optimizing your listing copy. Do this instead — fix your hero image first.",
    posted_at: new Date().toISOString(),
    likes: 320, comments: 8, shares: 9, views: null,
    niche: "amazon-seller",
  },
  {
    platform: "tiktok",
    source_id: "preflight-3",
    url: "https://tiktok.com/@preflight/video/3",
    author_handle: "preflight",
    content: "POV: your listing photos are killing your sales. Drop your ASIN, I'll roast it for free.",
    posted_at: new Date().toISOString(),
    likes: 1850, comments: 64, shares: 32, views: 24500,
    niche: "amazon-seller",
  },
  {
    platform: "linkedin",
    source_id: "preflight-4",
    url: "https://linkedin.com/posts/preflight/4",
    author_handle: "preflight",
    content: "I cold-emailed 1,200 founders. 3 said yes. Here's exactly what worked.",
    posted_at: new Date().toISOString(),
    likes: 410, comments: 38, shares: 11, views: null,
    niche: "ai-tools",
  },
  {
    platform: "reddit",
    source_id: "preflight-5",
    url: "https://reddit.com/r/AmazonSeller/comments/5",
    author_handle: "preflight",
    content: "The trick top sellers won't tell you about A+ content. (And no, it's not adding more pixels.)",
    posted_at: new Date().toISOString(),
    likes: 220, comments: 41, shares: 0, views: null,
    niche: "amazon-seller",
  },
];

function pass(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m  ${msg}`);
}
function fail(msg: string): never {
  console.log(`  \x1b[31m✗\x1b[0m  ${msg}`);
  process.exit(1);
}

async function main() {
  const sb = getServerClient();
  console.log("\n  Pre-flight checks (costs ~$0.01)\n");

  // 1) hook_patterns table seeded?
  const { data: pats, error: patErr } = await sb.from("hook_patterns").select("id");
  if (patErr) fail(`patterns table read: ${patErr.message}`);
  if (!pats || pats.length < HOOK_PATTERNS.length) {
    console.log("  …  seeding hook_patterns");
    const rows = HOOK_PATTERNS.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      description: p.description,
      examples: p.examples,
    }));
    const { error } = await sb.from("hook_patterns").upsert(rows, { onConflict: "id" });
    if (error) fail(`patterns upsert: ${error.message}`);
  }
  pass(`hook_patterns table reachable, ${HOOK_PATTERNS.length} patterns seeded`);

  // 2) classify batch via Claude Haiku
  const classified = await classifyBatch(MOCKS);
  if (classified.length === 0) fail("classifier returned 0 results — Anthropic key or prompt issue");
  if (!classified.every((c) => c.hook && c.pattern_id))
    fail("classifier returned malformed rows (missing hook or pattern_id)");
  pass(`classifier: ${classified.length}/${MOCKS.length} classified  (sample: "${classified[0].hook.slice(0, 50)}…" → ${classified[0].pattern_id})`);

  // 3) dedupe + upsert into posts (the bug we just fixed)
  const seen = new Set<string>();
  const dedup = classified.filter((c) => {
    const k = `${c.platform}::${c.source_id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // Inject one duplicate to verify dedup actually triggers
  const withDup = [...dedup, dedup[0]];
  const seen2 = new Set<string>();
  const reDedup = withDup.filter((c) => {
    const k = `${c.platform}::${c.source_id}`;
    if (seen2.has(k)) return false;
    seen2.add(k);
    return true;
  });
  if (reDedup.length !== dedup.length) fail("dedup logic broken");
  pass("dedupe filter works (no double-row upsert errors)");

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
    raw: (c.raw as Record<string, unknown>) ?? null,
  }));
  const { data: inserted, error: upErr } = await sb
    .from("posts")
    .upsert(upsertRows, { onConflict: "platform,source_id" })
    .select("id, hook, pattern_id, niche");
  if (upErr) fail(`upsert: ${upErr.message}`);
  if (!inserted || inserted.length !== dedup.length) fail(`upsert returned ${inserted?.length ?? 0}, expected ${dedup.length}`);
  pass(`upsert: ${inserted.length} rows in posts table`);

  // 4) embed via Voyage
  const targets = inserted.filter((r) => r.hook).map((r) => ({ id: r.id as string, hook: r.hook as string }));
  await embedHooks(targets);
  const { data: embCheck } = await sb
    .from("posts")
    .select("id")
    .in(
      "id",
      targets.map((t) => t.id),
    )
    .not("hook_embedding", "is", null);
  if ((embCheck?.length ?? 0) !== targets.length)
    fail(`embed: ${embCheck?.length ?? 0}/${targets.length} got embeddings`);
  pass(`embed: ${targets.length} vectors stored at dim 1024`);

  // 5) velocity + niche stats
  await recomputeVelocity();
  await recomputeNicheStats();
  const { count: vCount } = await sb.from("pattern_velocity").select("pattern_id", { count: "exact", head: true });
  const { count: nCount } = await sb.from("niche_pattern_stats").select("niche", { count: "exact", head: true });
  if ((vCount ?? 0) === 0) fail("pattern_velocity empty after recompute");
  pass(`velocity: ${vCount} pattern rows, ${nCount} niche×pattern cells`);

  // 6) cleanup the preflight rows so they don't pollute the demo
  await sb
    .from("posts")
    .delete()
    .like("source_id", "preflight-%");
  pass("cleaned up preflight rows");

  console.log("\n  \x1b[32mAll green. Safe to run `npm run bootstrap`.\x1b[0m\n");
}

main().catch((e) => {
  console.error("\n  \x1b[31m✗ preflight failed\x1b[0m\n");
  console.error(e);
  process.exit(1);
});
