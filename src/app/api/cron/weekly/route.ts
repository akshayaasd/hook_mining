import { NextRequest, NextResponse } from "next/server";
import { ingestNiche } from "@/lib/ingest";
import { sendDigest } from "@/lib/digest";

export const runtime = "nodejs";
export const maxDuration = 300;

const NICHES = ["amazon-seller", "ecommerce", "ai-tools"] as const;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ?? new URL(req.url).searchParams.get("secret");
  if (secret && secret !== provided) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = [];
  for (const n of NICHES) {
    try {
      results.push(await ingestNiche(n, { perSource: 25 }));
    } catch (e) {
      results.push({ niche: n, error: (e as Error).message });
    }
  }
  const digest = await sendDigest().catch((e: Error) => ({ ok: false, error: e.message }));
  return NextResponse.json({ results, digest });
}
