import "./_env";
import { ingestNiche } from "@/lib/ingest";
import { getServerClient } from "@/lib/supabase";

async function main() {
  const sb = getServerClient();
  const before = (await sb.from("posts").select("id", { count: "exact", head: true })).count ?? 0;

  console.log(`\n  Smoke ingest — 1 niche (amazon-seller), perSource=5, no LinkedIn`);
  console.log(`  rows in posts BEFORE: ${before}\n`);

  const r = await ingestNiche("amazon-seller", { perSource: 5 });
  console.log(`  result: ${JSON.stringify(r)}\n`);

  const after = (await sb.from("posts").select("id", { count: "exact", head: true })).count ?? 0;
  const delta = after - before;
  console.log(`  rows in posts AFTER:  ${after}  (Δ +${delta})\n`);

  if (delta === 0 && r.classified > 0) {
    console.log("  \x1b[31m✗ classified > 0 but no rows inserted — pipeline still broken\x1b[0m\n");
    process.exit(1);
  }
  if (delta === 0) {
    console.log("  \x1b[33m⚠ no rows inserted (no posts scraped or classified). Check upstream.\x1b[0m\n");
    process.exit(2);
  }

  // Sample a row to confirm shape
  const { data: sample } = await sb
    .from("posts")
    .select("hook, pattern_id, niche, platform, author_handle, engagement, hook_embedding")
    .order("scraped_at", { ascending: false })
    .limit(3);

  console.log("  Sample rows:");
  for (const s of sample ?? []) {
    const embDim = Array.isArray(s.hook_embedding) ? (s.hook_embedding as number[]).length : 0;
    console.log(`    [${s.platform} @${s.author_handle}] (${s.pattern_id}/${s.niche}) eng=${s.engagement} embed_dim=${embDim}`);
    console.log(`      "${(s.hook ?? "").slice(0, 90)}…"`);
  }
  console.log("\n  \x1b[32mSmoke ingest passed. Safe to run full bootstrap.\x1b[0m\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
