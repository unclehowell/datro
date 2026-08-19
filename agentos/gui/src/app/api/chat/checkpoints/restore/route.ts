// ============================================================
// Checkpoints — restore a saved session checkpoint
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { restoreCheckpoint } from "@/lib/harness";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, checkpointId } = body;
    if (!sessionId || !checkpointId) {
      return NextResponse.json({ error: "sessionId and checkpointId are required" }, { status: 400 });
    }
    const checkpoint = await restoreCheckpoint(sessionId, checkpointId);
    if (!checkpoint) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }
    return NextResponse.json({ checkpoint, messages: checkpoint.messages || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
