import "./_env";
import { getServerClient } from "@/lib/supabase";
import { classifyBatch } from "@/lib/classify";
import { embedHooks } from "@/lib/embed";
import type { Niche, Platform } from "@/lib/types";

async function main() {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("posts")
    .select("id, platform, source_id, url, author_handle, author_name, content, posted_at, likes, comments, shares, views, niche")
    .is("hook", null)
    .limit(120);
  if (error) throw error;
  if (!data || data.length === 0) {
    console.log("nothing to classify");
    return;
  }
  console.log(`→ classifying ${data.length} unclassified posts`);
  const classified = await classifyBatch(
    data.map((d) => ({
      platform: d.platform as Platform,
      source_id: d.source_id,
      url: d.url,
      author_handle: d.author_handle,
      author_name: d.author_name,
      content: d.content,
      posted_at: d.posted_at,
      likes: d.likes,
      comments: d.comments,
      shares: d.shares,
      views: d.views,
      niche: (d.niche ?? "general") as Niche,
    })),
  );
  for (const c of classified) {
    const match = data.find((d) => d.platform === c.platform && d.source_id === c.source_id);
    if (!match) continue;
    await sb
      .from("posts")
      .update({
        hook: c.hook,
        pattern_id: c.pattern_id,
        pattern_confidence: c.pattern_confidence,
        niche: c.niche,
      })
      .eq("id", match.id);
  }
  await embedHooks(
    classified
      .map((c) => ({ id: data.find((d) => d.platform === c.platform && d.source_id === c.source_id)?.id, hook: c.hook }))
      .filter((r): r is { id: string; hook: string } => Boolean(r.id && r.hook)),
  );
  console.log(`✔ classified ${classified.length} / embedded`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
