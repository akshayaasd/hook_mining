import { anthropic, CLAUDE_FAST } from "./anthropic";
import { HOOK_PATTERNS, PATTERN_BY_ID } from "./patterns";
import type { ClassifiedPost, Niche, RawPost } from "./types";
import { chunk, clampHook, safeJson } from "./utils";

const VALID_PATTERN_IDS = new Set(HOOK_PATTERNS.map((p) => p.id));

interface ClassifyOutput {
  hook: string;
  pattern_id: string;
  pattern_confidence: number;
  niche: Niche;
}

const PATTERN_LIST = HOOK_PATTERNS.map((p) => `- ${p.id}: ${p.name} — ${p.description}`).join("\n");
const NICHE_LIST = "amazon-seller, ecommerce, ai-tools, dtc, creator-economy, saas, general";

const SYSTEM_PROMPT = `You are a senior growth strategist who studies viral social posts.
For every post you receive, you isolate the HOOK (the first 1–2 sentences that stop the scroll), classify which pattern it follows, and tag the audience niche.

HOOK PATTERNS:
${PATTERN_LIST}

NICHES: ${NICHE_LIST}

Rules:
- Hook is verbatim text, max ~200 chars, first attention-grabbing line.
- pattern_id MUST be one of the ids above.
- pattern_confidence is 0–1.
- niche should reflect the audience the post is talking to.
- Skip junk — if content has no clear hook (pure image, ad copy fragment, < 8 words), set hook to "" and pattern_id to "skip".
- Always respond with a JSON ARRAY, one object per input post, in same order. Format:
[{"hook":"...","pattern_id":"...","pattern_confidence":0.85,"niche":"amazon-seller"}]
- pattern_id MUST be one of: ${HOOK_PATTERNS.map((p) => p.id).join(", ")}, or "skip". NEVER invent a new id.
Return ONLY the JSON array. No prose.`;

export async function classifyBatch(posts: RawPost[]): Promise<ClassifiedPost[]> {
  if (posts.length === 0) return [];
  const out: ClassifiedPost[] = [];
  for (const group of chunk(posts, 12)) {
    const userMsg = group
      .map(
        (p, i) =>
          `# Post ${i + 1}\nplatform: ${p.platform}\nhandle: @${p.author_handle}\nlikes: ${p.likes} comments: ${p.comments} shares: ${p.shares}\ncontent: ${p.content
            .replace(/\s+/g, " ")
            .slice(0, 600)}`,
      )
      .join("\n\n");

    let parsed: ClassifyOutput[] | null = null;
    try {
      const res = await anthropic.messages.create({
        model: CLAUDE_FAST,
        max_tokens: 2000,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userMsg }],
      });
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n");
      parsed = safeJson<ClassifyOutput[]>(text);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[classify]", (e as Error).message);
    }
    if (!parsed || parsed.length !== group.length) continue;
    for (let i = 0; i < group.length; i++) {
      const c = parsed[i];
      if (!c || !c.pattern_id || c.pattern_id === "skip" || !c.hook || c.hook.length < 6) continue;
      // Drop hallucinated pattern ids not in our taxonomy — FK would reject them anyway.
      if (!VALID_PATTERN_IDS.has(c.pattern_id)) {
        // eslint-disable-next-line no-console
        console.warn(`[classify] dropped unknown pattern_id "${c.pattern_id}" (model hallucination)`);
        continue;
      }
      out.push({
        ...group[i],
        hook: clampHook(c.hook),
        pattern_id: c.pattern_id,
        pattern_confidence: Math.max(0, Math.min(1, c.pattern_confidence ?? 0.5)),
        niche: (c.niche ?? group[i].niche ?? "general") as Niche,
      });
    }
  }
  return out;
}
