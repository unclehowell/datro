// ============================================================
// Checkpoints — list saved session checkpoints
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { listCheckpoints } from "@/lib/harness";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const checkpoints = await listCheckpoints(sessionId);
  return NextResponse.json({ sessionId, checkpoints });
}
