import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestNiche } from "@/lib/ingest";
import type { Niche } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  niche: z.enum(["amazon-seller", "ecommerce", "ai-tools", "dtc", "creator-economy", "saas", "general"]),
  perSource: z.number().int().min(5).max(80).default(30),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ?? new URL(req.url).searchParams.get("secret");
  if (secret && secret !== provided) return unauthorized();

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const result = await ingestNiche(parsed.niche as Niche, { perSource: parsed.perSource });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
