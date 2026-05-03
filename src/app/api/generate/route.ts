import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePosts } from "@/lib/generate";
import { getServerClient } from "@/lib/supabase";
import { discoverEmergingTopics } from "@/lib/tavily";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  voiceId: z.string().uuid(),
  productContext: z.string().min(10),
  patternIds: z.array(z.string()).min(1),
  count: z.number().int().min(1).max(15).default(10),
  niche: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const sb = getServerClient();
  const { data: voice, error } = await sb.from("brand_voices").select("*").eq("id", parsed.voiceId).single();
  if (error || !voice) return NextResponse.json({ error: "Voice not found" }, { status: 404 });

  const trendingTopics = await discoverEmergingTopics(parsed.niche ?? "amazon seller").catch(() => []);

  try {
    const posts = await generatePosts({
      voice,
      productContext: parsed.productContext,
      patternIds: parsed.patternIds,
      count: parsed.count,
      trendingTopics,
    });
    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
