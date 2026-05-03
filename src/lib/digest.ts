import { DIGEST_FROM, DIGEST_TO, resend } from "./resend";
import { getServerClient } from "./supabase";
import { PATTERN_BY_ID } from "./patterns";
import type { PatternVelocity } from "./types";

export interface WeeklyDigest {
  generatedAt: string;
  rising: PatternVelocity[];
  topHooks: Array<{ hook: string; pattern_id: string; engagement: number; url: string; author_handle: string }>;
  pixiiPostsCount: number;
}

export async function buildWeeklyDigest(): Promise<WeeklyDigest> {
  const sb = getServerClient();
  const { data: vel } = await sb
    .from("pattern_velocity")
    .select("*")
    .eq("trend", "rising")
    .order("velocity", { ascending: false })
    .limit(5);
  const { data: top } = await sb
    .from("posts")
    .select("hook, pattern_id, engagement, url, author_handle")
    .gte("posted_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("engagement", { ascending: false })
    .not("hook", "is", null)
    .limit(8);
  const { count: pixiiPostsCount } = await sb
    .from("generated_posts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString());
  return {
    generatedAt: new Date().toISOString(),
    rising: (vel ?? []) as PatternVelocity[],
    topHooks: (top ?? []) as WeeklyDigest["topHooks"],
    pixiiPostsCount: pixiiPostsCount ?? 0,
  };
}

export function renderDigestHtml(d: WeeklyDigest): string {
  const rising = d.rising
    .map((p) => {
      const pat = PATTERN_BY_ID[p.pattern_id];
      return `<tr><td style="padding:8px 0;">${pat?.emoji ?? ""} <strong>${pat?.name ?? p.pattern_id}</strong></td><td style="text-align:right;color:#16a34a;">+${Math.round((p.velocity - 1) * 100)}%</td></tr>`;
    })
    .join("");
  const top = d.topHooks
    .map((h) => `<li style="margin:10px 0;line-height:1.4;"><a href="${h.url}" style="color:#111;text-decoration:none;">${h.hook}</a><div style="font-size:12px;color:#888;">@${h.author_handle} · ${h.engagement.toLocaleString()} engagement</div></li>`)
    .join("");
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Inter,sans-serif;background:#fafafa;padding:24px;">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 4px;font-size:22px;">Hook Mining — weekly digest</h1>
    <p style="color:#777;margin:0 0 24px;">${new Date(d.generatedAt).toUTCString()}</p>
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;">Rising patterns</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${rising || "<tr><td>No clear movers this week.</td></tr>"}</table>
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;">Top hooks this week</h2>
    <ol style="padding-left:18px;margin:0 0 24px;">${top}</ol>
    <p style="color:#888;font-size:12px;">${d.pixiiPostsCount} Pixii posts ready in queue.</p>
  </div></body></html>`;
}

export async function sendDigest(to?: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY missing" };
  const recipient = to ?? DIGEST_TO;
  if (!recipient) return { ok: false, error: "DIGEST_TO_EMAIL missing" };
  const d = await buildWeeklyDigest();
  const html = renderDigestHtml(d);
  const r = await resend.emails.send({
    from: DIGEST_FROM,
    to: recipient,
    subject: `Hook Mining — ${d.rising.length} rising patterns this week`,
    html,
  });
  if (r.error) return { ok: false, error: r.error.message };
  return { ok: true, id: r.data?.id };
}
