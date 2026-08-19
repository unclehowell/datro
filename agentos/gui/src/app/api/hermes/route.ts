// ─── /api/hermes ───────────────────────────────────────────────
// GET  → current state of both hermes profiles
// POST { action: "start"|"stop"|"switch", profile: "hermes-local"|"hermes-proxy" }
//      → start/stop individual profiles, or switch (stops other first)
// ──────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getHermesState, startProfile, stopProfile, switchToProfile, HermesProfile } from "@/lib/hermes-gate";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getHermesState();
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  let body: { action?: string; profile?: string } = {};
  try { body = await req.json(); } catch {}

  const action = body.action ?? "switch";
  const profile = body.profile ?? "none";

  if (!["hermes-local", "hermes-proxy", "none"].includes(profile)) {
    return NextResponse.json({ ok: false, error: `Unknown profile: ${profile}` }, { status: 400 });
  }

  let state;
  switch (action) {
    case "start":
      state = await startProfile(profile);
      break;
    case "stop":
      state = await stopProfile(profile);
      break;
    case "switch":
      state = await switchToProfile(profile as HermesProfile);
      break;
    default:
      return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...state });
}
