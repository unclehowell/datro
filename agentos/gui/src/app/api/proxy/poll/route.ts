import { NextRequest, NextResponse } from "next/server";
import { unlockProxy } from "@/lib/proxy-state";

// ─── Shared session store (imported from submit route) ──────
// Note: In Next.js, each route is a separate module, so we use a global store
interface ProxySession {
  id: string;
  prompt: string;
  response: string | null;
  status: "pending" | "processing" | "completed" | "error";
  createdAt: number;
  completedAt: number | null;
  origin: string;
  error?: string;
}
declare global {
  // eslint-disable-next-line no-var
  var __proxySessions: Map<string, ProxySession> | undefined;
}
const sessions = globalThis.__proxySessions || new Map<string, ProxySession>();
globalThis.__proxySessions = sessions;

// ─── GET /api/proxy/poll ───────────────────────────────────
// Parent polls for response
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "completed" || session.status === "error") {
    // Release lock when done
    unlockProxy();
  }

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    response: session.response,
    error: session.error,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  });
}
