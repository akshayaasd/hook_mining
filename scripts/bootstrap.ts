import "./_env";
import { getServerClient } from "@/lib/supabase";
import { HOOK_PATTERNS } from "@/lib/patterns";
import { ingestNiche } from "@/lib/ingest";
import { learnBrandVoice } from "@/lib/voice";
import { generatePosts } from "@/lib/generate";
import { recomputeNicheStats, recomputeVelocity } from "@/lib/velocity";
import type { Niche } from "@/lib/types";

const TARGET_NICHES: Niche[] = ["amazon-seller", "ecommerce", "ai-tools"];
const PIXII_HANDLES = ["pixii_ai"];

async function seedPatterns() {
  const sb = getServerClient();
  const rows = HOOK_PATTERNS.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    description: p.description,
    examples: p.examples,
  }));
  await sb.from("hook_patterns").upsert(rows, { onConflict: "id" });
  console.log(`✔ patterns seeded (${rows.length})`);
}

async function main() {
  await seedPatterns();
  for (const n of TARGET_NICHES) {
    console.log(`→ ingesting ${n}`);
    try {
      const r = await ingestNiche(n, { perSource: 25 });
      console.log(`   ${JSON.stringify(r)}`);
    } catch (e) {
      console.warn(`  ! ${n}: ${(e as Error).message}`);
    }
  }
  await recomputeVelocity().catch(() => null);
  await recomputeNicheStats().catch(() => null);
  for (const handle of PIXII_HANDLES) {
    try {
      console.log(`→ learning voice @${handle}`);
      const v = await learnBrandVoice(handle);
      console.log(`✔ voice ${v.id}`);
      console.log(`→ generating Pixii posts in @${handle} voice`);
      const posts = await generatePosts({
        voice: v,
        productContext:
          "Pixii is the AI that designs Amazon listings — paste your ASIN, get 7 editable visuals plus the creative strategy that sells, in 2 minutes. Used by top agencies (Mindful Goods, Aspi, Ecomcy) to scale 80 listings/week.",
        patternIds: HOOK_PATTERNS.slice(0, 8).map((p) => p.id),
        count: 10,
      });
      console.log(`✔ generated ${posts.length} posts`);
    } catch (e) {
      console.warn(`  ! voice/gen ${handle}: ${(e as Error).message}`);
    }
  }
  console.log("✔ bootstrap complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
