import { NextRequest, NextResponse } from "next/server";
import { learnBrandVoice } from "@/lib/voice";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  handle: z.string().min(1).max(40),
  platform: z.enum(["twitter"]).default("twitter"),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const voice = await learnBrandVoice(parsed.handle, parsed.platform);
    return NextResponse.json({ voice });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
