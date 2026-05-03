import "./_env";
import { learnFirstAvailableVoice } from "@/lib/voice";
import { generatePosts } from "@/lib/generate";
import { HOOK_PATTERNS } from "@/lib/patterns";
import { recomputeNicheStats, recomputeVelocity } from "@/lib/velocity";
import { getServerClient } from "@/lib/supabase";

// Try @pixii_ai first (the actual brand). If empty (small/dormant), fall back to active
// founder voices in the same orbit — Amazon-seller / DTC / build-in-public AI tools.
// All public, well-documented. The point is to demo *that voice learning works*, the
// generator's quality is the same regardless of which handle we land on.
const VOICE_CANDIDATES = ["pixii_ai", "danielabolzmann", "JohnAspinall", "levelsio", "PieterLevels", "naval"];

const PRODUCT_CONTEXT =
  "Pixii is the AI that designs Amazon listings — paste your ASIN, get 7 editable visuals plus the creative strategy that sells, in 2 minutes. Used by top agencies (Mindful Goods, Aspi, Ecomcy) to scale 80 listings/week.";

async function main() {
  const sb = getServerClient();
  console.log("\n  Finishing bootstrap (voice + generate only) — ~$0.10\n");

  await recomputeVelocity().catch(() => null);
  await recomputeNicheStats().catch(() => null);

  const { data: vel } = await sb
    .from("pattern_velocity")
    .select("pattern_id, velocity, recent_count")
    .order("velocity", { ascending: false })
    .limit(8);
  let chosen = (vel ?? []).filter((v) => (v.recent_count ?? 0) > 0).map((v) => v.pattern_id as string);
  if (chosen.length < 3) chosen = HOOK_PATTERNS.slice(0, 8).map((p) => p.id);
  console.log(`  patterns to mix: ${chosen.join(", ")}\n`);

  console.log(`  → trying voice candidates: ${VOICE_CANDIDATES.map((h) => "@" + h).join(", ")}`);
  const { voice, handle, skipped } = await learnFirstAvailableVoice(VOICE_CANDIDATES);
  if (skipped.length > 0) console.log(`    skipped: ${skipped.join("; ")}`);
  console.log(`  ✓ learned voice for @${handle}`);
  console.log(`    "${voice.voice_summary.slice(0, 200)}…"\n`);

  console.log(`  → generating 10 posts in @${handle} voice for the Pixii product`);
  const posts = await generatePosts({
    voice,
    productContext: PRODUCT_CONTEXT,
    patternIds: chosen,
    count: 10,
  });
  console.log(`  ✓ ${posts.length} posts saved\n`);

  for (const p of posts.slice(0, 3)) {
    console.log(`  [${p.pattern_id}]  ${p.hook}`);
  }

  console.log("\n  \x1b[32mFinish bootstrap complete. `npm run dev` and open http://localhost:3001\x1b[0m\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
