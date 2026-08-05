import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

const TOKENS_DIR = join(homedir(), ".fcukproxy", "oauth");
const TOKENS_FILE = join(TOKENS_DIR, "tokens.json");

function readTokens(): Record<string, any> {
  try {
    return JSON.parse(readFileSync(TOKENS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeTokens(tokens: Record<string, any>) {
  mkdirSync(TOKENS_DIR, { recursive: true });
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

export async function GET() {
  const tokens = readTokens();
  // Never expose secrets in the token body — only connection status
  const status: Record<string, any> = {};
  for (const [platform, t] of Object.entries(tokens)) {
    status[platform] = { connected: true, at: t.at || null, account: t.account || null };
  }
  return NextResponse.json({ connections: status });
}

export async function POST(request: Request) {
  let body: { platform: string; token?: string; account?: string; remove?: boolean } | null = null;
  try {
    body = await request.json();
  } catch {}
  if (!body?.platform) return NextResponse.json({ error: "platform required" }, { status: 400 });

  const tokens = readTokens();
  if (body.remove) {
    delete tokens[body.platform];
  } else if (body.token) {
    tokens[body.platform] = {
      token: body.token,
      at: new Date().toISOString(),
      account: body.account || null,
    };
  } else {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  writeTokens(tokens);
  return NextResponse.json({ ok: true, connections: Object.keys(tokens) });
}