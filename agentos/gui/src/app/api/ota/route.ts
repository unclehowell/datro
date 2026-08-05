import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHILD_PROXY_URL = process.env.CHILD_PROXY_URL || "http://localhost:4001";

export async function POST() {
  try {
    const resp = await fetch(`${CHILD_PROXY_URL}/v1/ota/update`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ ok: resp.ok, message: resp.ok ? "Update check running in background" : "Proxy returned error" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: `Proxy unreachable: ${e.message}` }, { status: 502 });
  }
}