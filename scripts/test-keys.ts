import "./_env";

type CheckResult = { name: string; ok: boolean; detail: string };

const checks: Array<() => Promise<CheckResult>> = [];

checks.push(async () => {
  const name = "Supabase";
  try {
    const { getServerClient } = await import("@/lib/supabase");
    const sb = getServerClient();
    const { error } = await sb.from("hook_patterns").select("id", { head: true, count: "exact" });
    if (error) return { name, ok: false, detail: error.message };
    return { name, ok: true, detail: "connected, hook_patterns table reachable" };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message };
  }
});

checks.push(async () => {
  const name = "Anthropic";
  try {
    const { anthropic, CLAUDE_FAST } = await import("@/lib/anthropic");
    const r = await anthropic.messages.create({
      model: CLAUDE_FAST,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with one word: ok" }],
    });
    const txt = r.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return { name, ok: txt.toLowerCase().includes("ok"), detail: `responded: "${txt.trim()}"` };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message };
  }
});

checks.push(async () => {
  const name = "Voyage AI";
  try {
    const { embed, EMBED_DIM } = await import("@/lib/voyage");
    const v = await embed(["hello world"]);
    return { name, ok: v[0]?.length === EMBED_DIM, detail: `vector dim ${v[0]?.length ?? 0}` };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message };
  }
});

checks.push(async () => {
  const name = "Ensemble Data";
  try {
    const { scrapeTikTokKeyword } = await import("@/lib/ensemble");
    const posts = await scrapeTikTokKeyword("amazon seller tips", "7", 3);
    return { name, ok: posts.length > 0, detail: `${posts.length} TikTok posts` };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message };
  }
});

checks.push(async () => {
  const name = "Tavily";
  try {
    const { tavilySearch } = await import("@/lib/tavily");
    const r = await tavilySearch("amazon seller news this week", { topic: "news", days: 3, max: 3 });
    return { name, ok: r.length > 0, detail: `${r.length} results` };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message };
  }
});

checks.push(async () => {
  const name = "Apify";
  if (!process.env.APIFY_TOKEN) return { name, ok: false, detail: "APIFY_TOKEN not set (skip — get later)" };
  try {
    const { ApifyClient } = await import("apify-client");
    const c = new ApifyClient({ token: process.env.APIFY_TOKEN });
    const me = await c.user().get();
    return { name, ok: !!me?.username, detail: `authed as ${me?.username}` };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message };
  }
});

checks.push(async () => {
  const name = "Resend";
  if (!process.env.RESEND_API_KEY) return { name, ok: false, detail: "RESEND_API_KEY not set (skip — get later)" };
  // Send-only keys reject every read endpoint. The only safe non-destructive auth check is
  // POST /emails with a malformed payload — Resend returns 422 (auth ok, payload bad)
  // vs 401 (auth bad). 422 = key is valid.
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  if (r.status === 401) return { name, ok: false, detail: "401 invalid key" };
  if (r.status === 422 || r.status === 400 || r.status === 200) return { name, ok: true, detail: "key valid" };
  if (r.status === 403) return { name, ok: true, detail: "key valid (restricted scope ok for digest)" };
  return { name, ok: false, detail: `unexpected status ${r.status}` };
});

async function main() {
  console.log("\n  Testing API keys…\n");
  for (const c of checks) {
    process.stdout.write(`  …`);
    const r = await c();
    const mark = r.ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`\r  ${mark}  ${r.name.padEnd(16)} ${r.detail}`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
