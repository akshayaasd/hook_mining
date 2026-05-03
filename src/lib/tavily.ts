const TAVILY_KEY = process.env.TAVILY_API_KEY;

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export async function tavilySearch(query: string, opts?: { topic?: "general" | "news"; days?: number; max?: number }): Promise<TavilyResult[]> {
  if (!TAVILY_KEY) return [];
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TAVILY_KEY}` },
    body: JSON.stringify({
      query,
      topic: opts?.topic ?? "general",
      days: opts?.days ?? 7,
      max_results: opts?.max ?? 10,
      include_answer: false,
    }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}

export async function discoverEmergingTopics(niche: string): Promise<string[]> {
  const queries = [
    `viral ${niche} hooks last week twitter`,
    `trending ${niche} content this week`,
    `new ${niche} trends 2026`,
  ];
  const out = new Set<string>();
  for (const q of queries) {
    const r = await tavilySearch(q, { topic: "news", days: 7, max: 5 });
    for (const item of r) {
      const sentence = item.content.split(/[.!?]/).find((s) => s.length > 20 && s.length < 160);
      if (sentence) out.add(sentence.trim());
    }
  }
  return [...out].slice(0, 12);
}
