import { VelocityChart } from "@/components/velocity-chart";
import { NicheHeatmap, type HeatCell } from "@/components/niche-heatmap";
import { HookCard } from "@/components/hook-card";
import { getAllVelocity, getNicheStats, getRisingPatterns, getTopHooks } from "@/lib/queries";
import { PATTERN_BY_ID } from "@/lib/patterns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const [vel, rising, niche, top] = await Promise.all([
    getAllVelocity().catch(() => []),
    getRisingPatterns(3).catch(() => []),
    getNicheStats().catch(() => []),
    getTopHooks(8, { sinceDays: 7 }).catch(() => []),
  ]);

  return (
    <div className="space-y-12 py-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Trend engine</p>
        <h1 className="font-display text-5xl tracking-tight">This week&apos;s pattern velocity.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each pattern is benchmarked against its 30-day baseline. Patterns above 0% are gaining
          share-of-voice in viral feeds. The accent bars are your highest-leverage hooks for the next 7 days.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 lg:p-10">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {rising.map((r) => {
            const p = PATTERN_BY_ID[r.pattern_id];
            if (!p) return null;
            return (
              <Badge key={r.pattern_id} variant="rising">
                {p.emoji} {p.name} · +{Math.round((r.velocity - 1) * 100)}%
              </Badge>
            );
          })}
        </div>
        <VelocityChart data={vel} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 lg:p-8">
          <header className="mb-4">
            <h2 className="font-display text-2xl tracking-tight">Niche × pattern heatmap</h2>
            <p className="text-sm text-muted-foreground">Where each pattern actually lands.</p>
          </header>
          <NicheHeatmap cells={niche as HeatCell[]} />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 lg:p-8">
          <header className="mb-4">
            <h2 className="font-display text-2xl tracking-tight">Top 7-day hooks</h2>
          </header>
          <ul className="space-y-3">
            {top.length === 0 && <li className="text-sm text-muted-foreground">Run the ingest pipeline to populate.</li>}
            {top.slice(0, 6).map((h) => (
              <li key={h.id} className="rounded-2xl border border-border p-4">
                <p className="font-display text-lg leading-snug">“{h.hook}”</p>
                <p className="mt-2 text-xs text-muted-foreground">@{h.author_handle} · {h.platform}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-tight">Top hooks this week</h2>
        </header>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {top.map((p) => (
            <HookCard key={p.id} post={{ ...p, niche: p.niche ?? null }} />
          ))}
        </div>
      </section>
    </div>
  );
}
