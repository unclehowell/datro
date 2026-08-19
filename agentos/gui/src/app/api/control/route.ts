// ─── Control API ───────────────────────────────────────────────
// POST /api/control
//   { target: "llm",     action: "start" | "stop" | "status" }
//   { target: "openclaw", action: "start" | "stop" | "restart" | "status" }
// GET  /api/control → status of llm stack + openclaw + webgui
// ───────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  ensureLLMStack,
  getGateState,
  shutdownLLMStack,
  userService,
  userServiceActive,
  GateState,
} from "@/lib/llm-gate";
import { clearRouterCache } from "@/lib/harness";

export const dynamic = "force-dynamic";

const OPENCLAW_SERVICE = "openclaw-gateway";

export async function GET() {
  const [gate, openclaw] = await Promise.all([getGateState(), userServiceActive(OPENCLAW_SERVICE)]);
  return NextResponse.json({
    gate,
    openclaw: { active: openclaw },
    webgui: { port: 3000 },
  });
}

export async function POST(req: NextRequest) {
  let body: { target?: string; action?: string } = {};
  try {
    body = await req.json();
  } catch {}

  const target = body.target || "llm";
  const action = body.action || "status";

  if (target === "llm") {
    if (action === "start") {
      const gate: GateState = await ensureLLMStack();
      return NextResponse.json({ ok: true, gate });
    }
    if (action === "stop") {
      const gate: GateState = await shutdownLLMStack("manual");
      return NextResponse.json({ ok: true, gate });
    }
    return NextResponse.json({ ok: true, gate: await getGateState() });
  }

  if (target === "openclaw") {
    if (action === "start" || action === "stop" || action === "restart") {
      const res = await userService(OPENCLAW_SERVICE, action);
      const active = await userServiceActive(OPENCLAW_SERVICE);
      return NextResponse.json({ ok: res.ok, error: res.err || null, active });
    }
    return NextResponse.json({ ok: true, active: await userServiceActive(OPENCLAW_SERVICE) });
  }

  if (target === "call") {
    if (action === "hangup") {
      // Hanging up ends the call session: clear the route-level reply
      // cache so no stale reply from this call bleeds into the next one.
      clearRouterCache();
      return NextResponse.json({ ok: true, cache: "cleared" });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: `Unknown target: ${target}` }, { status: 400 });
}
