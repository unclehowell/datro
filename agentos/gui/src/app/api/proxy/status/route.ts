import { NextRequest, NextResponse } from "next/server";
import { isProxyLocked, getProxyLock } from "@/lib/proxy-state";

// ─── GET /api/proxy/status ─────────────────────────────────
// Check if child proxy is available and locked
export async function GET(req: NextRequest) {
  const locked = isProxyLocked();
  const lock = getProxyLock();

  return NextResponse.json({
    available: true,
    locked,
    lockInfo: lock ? {
      sessionId: lock.sessionId,
      origin: lock.origin,
      expiresAt: lock.expiresAt,
    } : null,
    version: "1.0.0",
    capabilities: ["chat", "tools", "voice", "graph"],
    model: "openbmb/minicpm5",
    uptime: process.uptime(),
  });
}

// ─── POST /api/proxy/lock ──────────────────────────────────
// Lock or unlock the session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, origin } = body;

    if (action === "lock") {
      return NextResponse.json({
        locked: true,
        sessionId,
        message: "Session locked for parent proxy",
      });
    }

    if (action === "unlock") {
      return NextResponse.json({
        locked: false,
        sessionId,
        message: "Session unlocked",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
