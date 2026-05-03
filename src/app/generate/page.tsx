import { GenerateClient } from "./generate-client";
import { getBrandVoices, getRisingPatterns } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ voice?: string }>;
}) {
  const sp = await searchParams;
  const [voices, rising] = await Promise.all([getBrandVoices().catch(() => []), getRisingPatterns(8).catch(() => [])]);
  return (
    <div className="space-y-10 py-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Generator</p>
        <h1 className="font-display text-5xl tracking-tight">Pick a voice. Write 10 posts in 30 seconds.</h1>
        <p className="max-w-2xl text-muted-foreground">
          The generator mixes the patterns currently rising in your niche and writes in the voice
          you select. Each post is saved and tagged so you can ship the winners.
        </p>
      </header>
      <GenerateClient voices={voices} rising={rising} initialVoiceId={sp.voice ?? voices[0]?.id} />
    </div>
  );
}
