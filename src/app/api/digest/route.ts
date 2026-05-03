import { NextResponse } from "next/server";
import { buildWeeklyDigest, renderDigestHtml } from "@/lib/digest";

export const runtime = "nodejs";

export async function GET() {
  const d = await buildWeeklyDigest();
  return new NextResponse(renderDigestHtml(d), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
