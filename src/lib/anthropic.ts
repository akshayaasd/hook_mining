import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey && typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.warn("[anthropic] ANTHROPIC_API_KEY not set — client will fail on first request");
}

export const anthropic = new Anthropic({ apiKey: apiKey ?? "missing" });

export const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
export const CLAUDE_FAST = "claude-haiku-4-5-20251001";
