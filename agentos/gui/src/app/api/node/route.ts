import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHILD_PROXY_URL = process.env.CHILD_PROXY_URL || "http://localhost:4001";
const AGENT_URL = process.env.AGENT_URL || "http://localhost:6100";

export async function GET() {
  let child: any = null;
  let agent: any = null;

  try {
    const c = await fetch(`${CHILD_PROXY_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (c.ok) child = await c.json();
  } catch {}

  try {
    const a = await fetch(`${AGENT_URL}/v1/agent/capabilities`, { signal: AbortSignal.timeout(4000) });
    if (a.ok) agent = await a.json();
  } catch {}

  if (!agent) {
    try {
      const s = await fetch(`${AGENT_URL}/status`, { signal: AbortSignal.timeout(3000) });
      if (s.ok) agent = await s.json();
    } catch {}
  }

  return NextResponse.json({
    child: child || { ok: false, version: "unreachable" },
    agent: agent || { version: "unreachable" },
    timestamp: new Date().toISOString(),
  });
}