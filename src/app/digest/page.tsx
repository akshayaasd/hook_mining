import { Button } from "@/components/ui/button";
import { buildWeeklyDigest, renderDigestHtml } from "@/lib/digest";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DigestPage() {
  const digest = await buildWeeklyDigest().catch(() => null);
  const html = digest ? renderDigestHtml(digest) : "<p>No digest data yet.</p>";

  return (
    <div className="space-y-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[2px] text-muted-foreground">Weekly digest</p>
          <h1 className="font-display text-5xl tracking-tight">Inbox preview.</h1>
          <p className="max-w-xl text-muted-foreground">
            What lands in your inbox every Monday. Rising patterns, top hooks, and a count of fresh
            Pixii posts already queued.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/api/digest" target="_blank">View raw HTML</Link>
          </Button>
          <form action="/api/digest/send" method="post">
            <Button type="submit">Send to test inbox</Button>
          </form>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
