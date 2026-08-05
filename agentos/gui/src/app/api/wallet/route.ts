import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PARENT_URL = process.env.PARENT_URL || "https://www.financecheque.uk";
const MACHINE_ID = process.env.MACHINE_ID || process.env.CHILD_ID || "child-localhost";

async function parentWallet() {
  const resp = await fetch(`${PARENT_URL}/api/proxy/wallet?machine_id=${encodeURIComponent(MACHINE_ID)}`, {
    signal: AbortSignal.timeout(8000),
  });
  return resp;
}

export async function GET() {
  try {
    const resp = await parentWallet();
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.ok ? 200 : 502 });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Parent unreachable: ${e.message}`, wallet_id: `node-${MACHINE_ID}`, balance: 0, total_earned: 0, currency: "FCUK" },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resp = await fetch(`${PARENT_URL}/api/proxy/wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machine_id: MACHINE_ID, ...body }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.ok ? 200 : 502 });
  } catch (e: any) {
    return NextResponse.json({ error: `Parent unreachable: ${e.message}` }, { status: 502 });
  }
}
