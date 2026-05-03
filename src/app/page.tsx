import Link from "next/link";
import { ArrowUpRight, Cpu, Database, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { HookCard } from "@/components/hook-card";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats, getRisingPatterns, getTopHooks } from "@/lib/queries";
import { PATTERN_BY_ID } from "@/lib/patterns";
import { formatCount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, rising, top] = await Promise.all([
    getOverviewStats().catch(() => ({ total: 0, weekly: 0, voices: 0, generated: 0 })),
    getRisingPatterns(5).catch(() => []),
    getTopHooks(6).catch(() => []),
  ]);

  return (
    <div className="space-y-16 py-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 lg:p-16">
        <div className="grain absolute inset-0 -z-10" />
        <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="mr-1.5 size-3.5" />
              Built for the Pixii growth loop
            </Badge>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-foreground lg:text-7xl">
              Mine 1,000 viral hooks a week.<br />
              Ship the ones that work.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
              An autonomous agent army that crawls TikTok, IG, X, YouTube, Reddit and LinkedIn,
              classifies every hook by pattern + niche, and writes new posts in your brand
              voice using whichever patterns are rising right now.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/generate">
                  Generate Pixii posts <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/trends">See this week&apos;s trends</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Hooks indexed" value={formatCount(stats.total)} hint="all-time" />
            <StatCard label="This week" value={formatCount(stats.weekly)} delta="+ live" hint="rolling 7-day" />
            <StatCard label="Brand voices" value={stats.voices} hint="learned" />
            <StatCard label="Posts written" value={stats.generated} hint="for Pixii + clients" />
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[2px] text-muted-foreground">The pipeline</p>
            <h2 className="font-display text-3xl tracking-tight">Four agents. One loop.</h2>
          </div>
        </header>
        <div className="grid gap-4 lg:grid-cols-4">
          {[{
            icon: <Database className="size-5" />, name: "Crawler", body: "Ensemble Data + Apify pull viral posts from 6 platforms across 7 niches. Engagement-thresholded.",
          }, {
            icon: <Cpu className="size-5" />, name: "Classifier", body: "Claude Haiku 4.5 isolates the hook, picks 1 of 20 pattern IDs, tags niche, scores confidence.",
          }, {
            icon: <Workflow className="size-5" />, name: "Trend engine", body: "OpenAI embeddings + 7d/30d velocity surface rising patterns. Tavily widens the topic radar.",
          }, {
            icon: <Sparkles className="size-5" />, name: "Writer", body: "Claude Sonnet 4.6 generates posts in a learned brand voice using the trending pattern mix.",
          }].map((step, i) => (
            <div key={step.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  {step.icon}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider">step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RISING + HOOKS */}
      <section className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <header>
            <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Rising patterns</p>
            <h2 className="font-display text-3xl tracking-tight">What&apos;s working this week</h2>
          </header>
          <ul className="space-y-2">
            {rising.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">No data yet — run the ingest pipeline. <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed</code></li>}
            {rising.map((r) => {
              const p = PATTERN_BY_ID[r.pattern_id];
              if (!p) return null;
              const pct = Math.round((r.velocity - 1) * 100);
              return (
                <li key={r.pattern_id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{r.recent_count} posts · 7d</p>
                    </div>
                  </div>
                  <Badge variant={r.trend === "rising" ? "rising" : r.trend === "falling" ? "falling" : "outline"}>
                    {pct >= 0 ? "+" : ""}{pct}%
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="space-y-4">
          <header className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Top hooks</p>
              <h2 className="font-display text-3xl tracking-tight">Recently mined</h2>
            </div>
            <Link href="/library" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Open library →
            </Link>
          </header>
          <div className="grid gap-3 md:grid-cols-2">
            {top.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Library empty. Run a quick ingest to fill it: <code className="rounded bg-secondary px-1.5 py-0.5">npm run ingest</code>
              </div>
            )}
            {top.map((p) => (
              <HookCard key={p.id} post={{ ...p, niche: p.niche ?? null }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
