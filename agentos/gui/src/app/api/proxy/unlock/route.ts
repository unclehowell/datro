import { NextRequest, NextResponse } from "next/server";
import { unlockProxy } from "@/lib/proxy-state";

// ─── POST /api/proxy/unlock ────────────────────────────────
// Unlock the proxy session (for "New Session" button)
export async function POST(req: NextRequest) {
  try {
    unlockProxy();
    return NextResponse.json({
      unlocked: true,
      message: "Session unlocked. You can now use the chat.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
