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

// OAuth callback for connected platforms. OAuth servers redirect here with
// ?platform=<id>&code=<auth_code> (or #access_token for implicit flows).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") || url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("access_token");
  const account = url.searchParams.get("account");

  if (!platform) {
    return new NextResponse(
      "<html><body style='font-family:monospace;padding:2rem'><h2>Missing platform</h2><p>OAuth callback received but no platform was specified. Close this tab and try connecting again.</p></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (code || token) {
    const tokens = readTokens();
    tokens[platform] = {
      token: token || code,
      code: code || null,
      at: new Date().toISOString(),
      account: account || null,
      pending: !token, // code flow needs an exchange step later
    };
    writeTokens(tokens);
  }

  return new NextResponse(
    `<html><body style='font-family:monospace;padding:2rem'><h2>Connected: ${platform}</h2><p>OAuth token stored on this device. You can close this tab.</p><p><a href="http://localhost:3000/connect">Back to Connect</a></p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}