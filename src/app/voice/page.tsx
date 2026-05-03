import { Badge } from "@/components/ui/badge";
import { LearnVoiceForm } from "./learn-form";
import { getBrandVoices } from "@/lib/queries";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const voices = await getBrandVoices().catch(() => []);

  return (
    <div className="space-y-12 py-8">
      <header className="grid items-end gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Brand voice</p>
          <h1 className="font-display text-5xl tracking-tight">Pixii&apos;s writing room.</h1>
          <p className="max-w-xl text-muted-foreground">
            Drop any X handle. We pull 40 of their recent posts, distill the voice, and store it.
            Generations stay on-brand without a single style-guide doc.
          </p>
        </div>
        <LearnVoiceForm />
      </header>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[2px] text-muted-foreground">Learned voices</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {voices.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No voices learned yet. Try <code className="rounded bg-secondary px-1.5 py-0.5">@pixii_ai</code> above.
            </p>
          )}
          {voices.map((v) => (
            <article key={v.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl">@{v.handle}</h3>
                <Badge variant="outline" className="capitalize">{v.platform}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-5">{v.voice_summary}</p>
              {v.preferred_patterns?.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {v.preferred_patterns.slice(0, 4).map((p: string) => (
                    <Badge key={p} variant="accent" className="capitalize">{p.replace(/-/g, " ")}</Badge>
                  ))}
                </div>
              ) : null}
              <p className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
                {format(new Date(v.created_at), "PPP")}
              </p>
              <Link
                href={`/generate?voice=${v.id}`}
                className="mt-4 inline-flex text-sm font-medium text-foreground hover:underline"
              >
                Generate posts →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
