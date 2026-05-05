import { anthropic, CLAUDE_MODEL } from "./anthropic";
import { HOOK_PATTERNS, PATTERN_BY_ID } from "./patterns";
import { getServerClient } from "./supabase";
import type { BrandVoice, GeneratedPost } from "./types";
import { safeJson } from "./utils";

interface GenLLMOutput {
  hook: string;
  body: string;
  cta: string;
  pattern_id: string;
  rationale: string;
}

const GEN_SYSTEM = `You are a viral copywriter trained on hundreds of high-performing posts. You write in a target brand's voice, picking from a library of proven hook patterns.

Write social posts (Twitter/X length unless told otherwise). Each post MUST be a JSON object with EXACTLY these keys:
- "hook": The opening line that follows the chosen pattern.
- "body": 2–6 short lines. No filler. Concrete, specific, scannable.
- "cta": 1 line. Soft or sharp depending on voice.
- "pattern_id": EXACT id of the pattern used (e.g. "stat-shock", not "Stat Shock").
- "rationale": 1 sentence on why this pattern fits this product right now.

Return ONLY a JSON array. No prose. No markdown fences.`;

export async function generatePosts(opts: {
  voice: BrandVoice;
  productContext: string;
  patternIds: string[];
  count?: number;
  trendingTopics?: string[];
}): Promise<GeneratedPost[]> {
  const { voice, productContext, patternIds, count = 10, trendingTopics = [] } = opts;
  const patterns = patternIds
    .map((id) => PATTERN_BY_ID[id])
    .filter(Boolean)
    .slice(0, 8);
  if (patterns.length === 0) {
    patterns.push(...HOOK_PATTERNS.slice(0, 5));
  }

  const userPrompt = `BRAND VOICE — @${voice.handle}
${voice.voice_summary}

Vocab signals: ${(voice.vocab_signals ?? []).slice(0, 12).join(" | ") || "—"}
Sample posts:
${(voice.sample_posts ?? []).slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join("\n") || "—"}

PRODUCT / TOPIC:
${productContext}

${trendingTopics.length ? `TRENDING TOPICS THIS WEEK (use 1–3 if relevant):\n- ${trendingTopics.join("\n- ")}\n` : ""}

PATTERNS TO USE (mix across the ${count} posts):
${patterns.map((p) => `- ${p.id}: ${p.name} — ${p.description}\n  Examples: ${p.examples.slice(0, 2).join(" / ")}`).join("\n")}

Generate ${count} distinct posts. Vary patterns. Stay in brand voice. JSON array only.`;

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    system: GEN_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");
  const parsed = safeJson<GenLLMOutput[]>(text);
  if (!parsed || !Array.isArray(parsed)) throw new Error("Generator returned no JSON");

  const sb = getServerClient();
  const rows = parsed
    .map((p) => {
      let pat: any = PATTERN_BY_ID[p.pattern_id];
      if (!pat) {
        pat = HOOK_PATTERNS.find(x => x.name.toLowerCase() === String(p.pattern_id).toLowerCase());
      }
      return { ...p, matched_pattern_id: pat?.id };
    })
    .filter((p) => p.hook && p.body && p.matched_pattern_id)
    .map((p) => ({
      brand_voice_id: voice.id,
      pattern_id: p.matched_pattern_id as string,
      hook: String(p.hook).trim(),
      body: String(p.body).trim(),
      cta: String(p.cta ?? "").trim(),
      product_context: productContext,
      rationale: String(p.rationale ?? "").trim(),
    }));
    
  if (rows.length === 0) {
    console.error("Generator failed to produce valid posts. Raw parsed output:", parsed);
    throw new Error("Generator produced 0 valid posts. Please try again.");
  }
  const { data, error } = await sb.from("generated_posts").insert(rows).select();
  if (error) throw error;
  return (data ?? []) as GeneratedPost[];
}
