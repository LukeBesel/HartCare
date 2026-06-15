import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight health check for Railway/Render/Docker probes. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "hartcare",
    time: new Date().toISOString(),
  });
}
