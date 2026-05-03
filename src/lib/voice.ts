import { anthropic, CLAUDE_MODEL } from "./anthropic";
import { scrapeTwitterUserDetailed } from "./ensemble";
import { getServerClient } from "./supabase";
import type { BrandVoice, Platform } from "./types";
import { safeJson } from "./utils";

interface VoiceLLMOutput {
  voice_summary: string;
  preferred_patterns: string[];
  vocab_signals: string[];
}

const VOICE_SYSTEM = `You are a brand-voice analyst. Given 20–50 sample posts from one author, write a sharp, agency-grade voice profile that another writer could use to mimic them.

Return JSON only:
{
  "voice_summary": "2–4 sentences. Tone, register, attitude, sentence rhythm. Be specific.",
  "preferred_patterns": ["contrarian", "stat-shock", ...],
  "vocab_signals": ["distinctive phrases or vocabulary the author repeats"]
}`;

export class EmptyVoiceSourceError extends Error {
  constructor(handle: string, public followers: number, public statuses: number) {
    super(
      `@${handle} has no scrapable tweets (followers=${followers}, statuses=${statuses}). Try a different handle.`,
    );
  }
}

export async function learnBrandVoice(handle: string, platform: Platform = "twitter"): Promise<BrandVoice> {
  const handleClean = handle.replace(/^@/, "");
  const snap = platform === "twitter" ? await scrapeTwitterUserDetailed(handleClean, 40) : null;
  if (!snap) throw new Error(`Could not look up @${handleClean} on ${platform}`);
  if (snap.tweets.length === 0) {
    throw new EmptyVoiceSourceError(handleClean, snap.followers, snap.statuses);
  }

  const corpus = snap.tweets
    .filter((s) => s.content && s.content.length > 12)
    .slice(0, 40)
    .map((s, i) => `${i + 1}. ${s.content.replace(/\s+/g, " ").slice(0, 400)}`)
    .join("\n");

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: VOICE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Author: @${handleClean} on ${platform}${snap.display_name ? ` ("${snap.display_name}")` : ""}\n\nPosts:\n${corpus}`,
      },
    ],
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");
  const parsed = safeJson<VoiceLLMOutput>(text);
  if (!parsed) throw new Error("Voice analyzer returned no JSON");

  const sb = getServerClient();
  const sample_posts = snap.tweets
    .filter((s) => s.content)
    .slice(0, 10)
    .map((s) => s.content.replace(/\s+/g, " ").slice(0, 280));

  const { data, error } = await sb
    .from("brand_voices")
    .upsert(
      {
        handle: handleClean,
        platform,
        voice_summary: parsed.voice_summary,
        preferred_patterns: parsed.preferred_patterns ?? [],
        vocab_signals: parsed.vocab_signals ?? [],
        sample_posts,
      },
      { onConflict: "handle,platform" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as BrandVoice;
}

/**
 * Try a list of handles in order and learn the first one that has scrapable tweets.
 * Returns the learned voice + the handle that actually worked.
 */
export async function learnFirstAvailableVoice(handles: string[]): Promise<{ voice: BrandVoice; handle: string; skipped: string[] }> {
  const skipped: string[] = [];
  for (const h of handles) {
    try {
      const v = await learnBrandVoice(h);
      return { voice: v, handle: h, skipped };
    } catch (e) {
      if (e instanceof EmptyVoiceSourceError) {
        skipped.push(`@${h} (no tweets)`);
        continue;
      }
      // Non-empty error: log and continue to next handle so the demo doesn't die
      // eslint-disable-next-line no-console
      console.warn(`[voice @${h}]`, (e as Error).message);
      skipped.push(`@${h} (${(e as Error).message.slice(0, 60)})`);
    }
  }
  throw new Error(`None of [${handles.join(", ")}] had usable Twitter content. Skipped: ${skipped.join("; ")}`);
}
