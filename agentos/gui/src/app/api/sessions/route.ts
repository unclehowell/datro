// ============================================================
// Sessions API — Full session lifecycle management
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { AgentLoop } from "@/runtime/loop";
import { Session } from "@/runtime/types";

let agentLoop: AgentLoop | null = null;

function getAgentLoop(): AgentLoop {
  if (!agentLoop) {
    agentLoop = new AgentLoop({ logLevel: "info" });
  }
  return agentLoop;
}

// GET: List sessions or get specific session
export async function GET(req: NextRequest) {
  const loop = getAgentLoop();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  const status = searchParams.get("status") as any;

  if (sessionId) {
    const session = loop.getSessionManager().getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const graph = loop.getGraphManager().getGraphBySessionId(sessionId);
    return NextResponse.json({
      session,
      graph: graph ? {
        id: graph.id,
        stats: loop.getGraphManager().getStats(graph.id),
        progress: loop.getGraphManager().getProgress(graph.id),
      } : null,
      supervisor: loop.getSupervisor()?.getState() || null,
    });
  }

  const sessions = loop.getSessionManager().listSessions(status);
  return NextResponse.json({
    sessions,
    total: sessions.length,
    active: sessions.filter((s: Session) => ["running", "planning", "verifying", "reflecting"].includes(s.status)).length,
    queued: sessions.filter((s: Session) => s.status === "queued").length,
  });
}

// POST: Create a new session
export async function POST(req: NextRequest) {
  const loop = getAgentLoop();
  const { goal, priority, description, maxRetries } = await req.json();

  if (!goal) {
    return NextResponse.json({ error: "Goal is required" }, { status: 400 });
  }

  const session = await loop.getSessionManager().createSession(goal, {
    priority: priority || "normal",
    description,
    maxRetries,
  });

  return NextResponse.json({ session });
}

// PATCH: Update session
export async function PATCH(req: NextRequest) {
  const loop = getAgentLoop();
  const { sessionId, action, status } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  if (action === "start") {
    const result = await loop.runObjective(sessionId, "");
    return NextResponse.json({ result });
  }

  if (action === "cancel") {
    const cancelled = await loop.getScheduler().cancel(sessionId);
    return NextResponse.json({ cancelled });
  }

  if (action === "pause") {
    const paused = await loop.getScheduler().pause(sessionId);
    return NextResponse.json({ paused });
  }

  if (action === "resume") {
    const resumed = await loop.getScheduler().resume(sessionId);
    return NextResponse.json({ resumed });
  }

  if (status) {
    const updated = await loop.getSessionManager().updateStatus(sessionId, status);
    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
