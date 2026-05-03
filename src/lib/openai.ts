import OpenAI from "openai";

// OpenAI client — used by /generate flows that may want chat completions in the future.
// Embeddings are now handled by Voyage AI (see ./voyage.ts) because Voyage has a generous
// free tier and matches OpenAI quality for retrieval.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "missing",
});

// Re-export the canonical embed() from voyage so existing imports keep working.
export { embed, EMBED_DIM, EMBED_MODEL } from "./voyage";
