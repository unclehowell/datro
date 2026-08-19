import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { invalidateKeysCache } from "@/lib/cloud-router";
import { OAUTH_KEY_MAP } from "@/lib/app-catalog";

export const dynamic = "force-dynamic";

const TOKENS_DIR = join(homedir(), ".fcukproxy", "oauth");
const TOKENS_FILE = join(TOKENS_DIR, "tokens.json");
const KEYS_PATH = join(homedir(), ".llm_keys");

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

function readKeys(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(KEYS_PATH, "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^export\s+(\w+)=(.*)/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

function writeKeys(keys: Record<string, string>) {
  mkdirSync(homedir(), { recursive: true });
  const lines = Object.entries(keys)
    .map(([k, v]) => `export ${k}="${v ? v.replace(/(["\s])/g, "\\$1") : ""}"`)
    .join("\n");
  writeFileSync(KEYS_PATH, lines + "\n", { mode: 0o600 });
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

    // OAuth-token-capable services map straight into ~/.llm_keys so the
    // cloud router / child agent can use the connection immediately.
    const envKey = OAUTH_KEY_MAP[platform];
    const tokenValue = token || code;
    if (envKey && tokenValue) {
      const keys = readKeys();
      keys[envKey] = tokenValue;
      writeKeys(keys);
      process.env[envKey] = tokenValue;
      invalidateKeysCache();
    }
  }

  return new NextResponse(
    `<html><body style='font-family:monospace;padding:2rem'><h2>Connected: ${platform}</h2><p>OAuth token stored on this device and handed to the local agents. You can close this tab.</p><p><a href="/settings">Back to Apps</a></p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}