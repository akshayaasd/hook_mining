import "./_env";
import { getServerClient } from "@/lib/supabase";

async function main() {
  const sb = getServerClient();
  console.log("\n  DB verification (read-only, zero cost)\n");

  const tables = ["posts", "hook_patterns", "brand_voices", "generated_posts", "pattern_velocity", "niche_pattern_stats"];
  for (const t of tables) {
    const { count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`  ${t.padEnd(24)} ${count ?? 0} rows`);
  }

  // Check embedding coverage
  const { count: total } = await sb.from("posts").select("id", { count: "exact", head: true });
  const { count: withEmbedding } = await sb
    .from("posts")
    .select("id", { count: "exact", head: true })
    .not("hook_embedding", "is", null);
  console.log(`\n  embeddings: ${withEmbedding ?? 0} / ${total ?? 0} posts have hook_embedding stored`);

  // Pattern distribution
  const { data: byPat } = await sb.from("posts").select("pattern_id").not("pattern_id", "is", null);
  const counts: Record<string, number> = {};
  for (const r of byPat ?? []) {
    counts[r.pattern_id as string] = (counts[r.pattern_id as string] ?? 0) + 1;
  }
  console.log(`\n  pattern distribution:`);
  for (const [pid, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${pid.padEnd(20)} ${"█".repeat(Math.min(40, n))} ${n}`);
  }

  // Pattern-id sanity: any FK orphans?
  const { data: pats } = await sb.from("hook_patterns").select("id");
  const valid = new Set((pats ?? []).map((p) => p.id as string));
  const orphans = Object.keys(counts).filter((p) => !valid.has(p));
  if (orphans.length > 0) {
    console.log(`\n  \x1b[31m✗ orphan pattern_ids in posts: ${orphans.join(", ")}\x1b[0m`);
  } else {
    console.log(`\n  \x1b[32m✓ no orphan pattern_ids\x1b[0m`);
  }

  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
