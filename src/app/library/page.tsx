import { HookCard } from "@/components/hook-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HOOK_PATTERNS, NICHES } from "@/lib/patterns";
import { getTopHooks } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLATFORMS = ["tiktok", "instagram", "twitter", "youtube", "linkedin", "reddit"];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ pattern?: string; niche?: string; platform?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const hooks = await getTopHooks(60, { sinceDays: 30, ...sp }).catch(() => []);

  const buildHref = (key: string, value?: string) => {
    const params = new URLSearchParams(sp as Record<string, string>);
    if (!value || params.get(key) === value) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    return `/library${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-10 py-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Hook library</p>
        <h1 className="font-display text-5xl tracking-tight">{hooks.length}+ hooks. Searchable. Tagged.</h1>
        <form className="flex max-w-xl items-center gap-2" action="/library">
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search hooks…" className="h-11" />
          {sp.pattern && <input type="hidden" name="pattern" value={sp.pattern} />}
          {sp.niche && <input type="hidden" name="niche" value={sp.niche} />}
          {sp.platform && <input type="hidden" name="platform" value={sp.platform} />}
        </form>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patterns:</span>
          {HOOK_PATTERNS.map((p) => (
            <Link key={p.id} href={buildHref("pattern", p.id)}>
              <Badge variant={sp.pattern === p.id ? "accent" : "outline"}>
                {p.emoji} {p.name}
              </Badge>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Niches:</span>
          {NICHES.map((n) => (
            <Link key={n.id} href={buildHref("niche", n.id)}>
              <Badge variant={sp.niche === n.id ? "accent" : "outline"}>{n.name}</Badge>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Platforms:</span>
          {PLATFORMS.map((p) => (
            <Link key={p} href={buildHref("platform", p)}>
              <Badge variant={sp.platform === p ? "accent" : "outline"} className="capitalize">{p}</Badge>
            </Link>
          ))}
        </div>
      </section>

      {hooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No hooks match these filters yet.
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hooks.map((p) => (
            <HookCard key={p.id} post={{ ...p, niche: p.niche ?? null }} />
          ))}
        </section>
      )}
    </div>
  );
}
