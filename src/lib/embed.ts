import { embed } from "./openai";
import { getServerClient } from "./supabase";
import { chunk } from "./utils";

export async function embedHooks(rows: { id: string; hook: string }[]): Promise<void> {
  if (rows.length === 0) return;
  const sb = getServerClient();
  for (const group of chunk(rows, 96)) {
    const vectors = await embed(group.map((r) => r.hook));
    for (let i = 0; i < group.length; i++) {
      await sb.from("posts").update({ hook_embedding: vectors[i] }).eq("id", group[i].id);
    }
  }
}

export interface SimilarHookHit {
  id: string;
  hook: string;
  pattern_id: string;
  niche: string;
  engagement: number;
  similarity: number;
}

export async function similarHooks(text: string, count = 12): Promise<SimilarHookHit[]> {
  const [vec] = await embed([text]);
  const sb = getServerClient();
  const { data, error } = await sb.rpc("match_hooks", {
    query_embedding: vec,
    match_threshold: 0.4,
    match_count: count,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[similarHooks]", error.message);
    return [];
  }
  return (data ?? []) as SimilarHookHit[];
}
