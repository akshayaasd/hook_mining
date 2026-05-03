import { NextRequest, NextResponse } from "next/server";
import { sendDigest } from "@/lib/digest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") ?? undefined;
  const r = await sendDigest(to);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.redirect(new URL("/digest", req.url));
}
