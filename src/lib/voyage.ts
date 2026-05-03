const KEY = process.env.VOYAGE_API_KEY;

export const EMBED_MODEL = "voyage-3.5-lite";
export const EMBED_DIM = 1024;

interface VoyageResp {
  object: string;
  data: Array<{ object: string; embedding: number[]; index: number }>;
  model: string;
  usage: { total_tokens: number };
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (!KEY) throw new Error("VOYAGE_API_KEY missing — sign up free at https://www.voyageai.com");
  if (texts.length === 0) return [];
  const cleaned = texts.map((t) => t.replace(/\s+/g, " ").trim().slice(0, 2000));
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: cleaned,
      model: EMBED_MODEL,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as VoyageResp;
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}
