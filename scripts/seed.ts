import "./_env";
import { getServerClient } from "@/lib/supabase";
import { HOOK_PATTERNS } from "@/lib/patterns";

async function main() {
  const sb = getServerClient();
  const rows = HOOK_PATTERNS.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    description: p.description,
    examples: p.examples,
  }));
  const { error } = await sb.from("hook_patterns").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`✔ seeded ${rows.length} hook patterns`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
