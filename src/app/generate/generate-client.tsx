"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HOOK_PATTERNS, PATTERN_BY_ID } from "@/lib/patterns";
import type { BrandVoice, GeneratedPost, PatternVelocity } from "@/lib/types";
import { Loader2, Sparkles, Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GenerateClient({
  voices,
  rising,
  initialVoiceId,
}: {
  voices: BrandVoice[];
  rising: PatternVelocity[];
  initialVoiceId?: string;
}) {
  const [voiceId, setVoiceId] = useState<string | undefined>(initialVoiceId ?? voices[0]?.id);
  const defaultPatterns = useMemo(
    () => (rising.length ? rising.slice(0, 5).map((r) => r.pattern_id) : HOOK_PATTERNS.slice(0, 5).map((p) => p.id)),
    [rising],
  );
  const [selected, setSelected] = useState<string[]>(defaultPatterns);
  const [productContext, setProductContext] = useState(
    "Pixii is the AI that designs Amazon listings — paste your ASIN, get 7 editable visuals + a creative strategy in 2 minutes. Top agencies use Pixii to scale 80 listings/week.",
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedPost[]>([]);

  const selectedVoice = voices.find((v) => v.id === voiceId);

  function togglePattern(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function generate() {
    if (!voiceId) {
      toast.error("Pick a brand voice first.");
      return;
    }
    if (selected.length === 0) {
      toast.error("Pick at least one pattern.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voiceId, productContext, patternIds: selected, count: 10 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generate failed");
      setResults(json.posts as GeneratedPost[]);
      toast.success(`Wrote ${json.posts.length} posts`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyPost(p: GeneratedPost) {
    const text = [p.hook, "", p.body, p.cta].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <aside className="space-y-6 rounded-3xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Brand voice</p>
          {voices.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No voices yet. <a href="/voice" className="font-medium text-foreground underline">Learn one →</a>
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    voiceId === v.id ? "border-transparent bg-foreground text-background" : "border-border hover:border-foreground/40",
                  )}
                >
                  @{v.handle}
                </button>
              ))}
            </div>
          )}
          {selectedVoice && (
            <p className="mt-4 line-clamp-4 text-xs text-muted-foreground">{selectedVoice.voice_summary}</p>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Product / topic</p>
          <Textarea value={productContext} onChange={(e) => setProductContext(e.target.value)} className="mt-2" rows={5} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Patterns to mix</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {rising.length > 0 ? "Defaulted to the patterns trending up this week." : "Pick the patterns you want."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {HOOK_PATTERNS.map((p) => {
              const active = selected.includes(p.id);
              const r = rising.find((x) => x.pattern_id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePattern(p.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    active ? "border-transparent bg-accent text-accent-foreground" : "border-border hover:border-foreground/40",
                  )}
                >
                  {p.emoji} {p.name}
                  {r && r.trend === "rising" && <span className="ml-1 font-mono text-[10px] opacity-80">↑{Math.round((r.velocity - 1) * 100)}%</span>}
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={generate} disabled={loading} size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          Generate 10 posts
        </Button>
      </aside>

      <section className="space-y-3">
        {results.length === 0 ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <Sparkles className="size-8 text-foreground/30" />
            <p className="mt-3 text-sm">Output appears here.</p>
            <p className="text-xs">Each post is saved with its rationale and pattern tag.</p>
          </div>
        ) : (
          results.map((p) => {
            const pat = PATTERN_BY_ID[p.pattern_id];
            return (
              <article key={p.id} className="group rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <Badge variant="accent">
                    {pat?.emoji} {pat?.name ?? p.pattern_id}
                  </Badge>
                  <button onClick={() => copyPost(p)} className="text-muted-foreground hover:text-foreground" aria-label="Copy">
                    <Copy className="size-4" />
                  </button>
                </div>
                <p className="mt-3 font-display text-2xl leading-tight">{p.hook}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{p.body}</p>
                {p.cta && <p className="mt-3 text-sm font-medium text-foreground">{p.cta}</p>}
                {p.rationale && <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">Why:</span> {p.rationale}</p>}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
