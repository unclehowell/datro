import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const STATE_DIR = join(homedir(), ".fcukproxy", "agentos");
const STATE_FILE = join(STATE_DIR, "onboarding.json");
const TOKEN_FILE = join(homedir(), ".fcukproxy", "oauth", "tokens.json");
const OPENCODE_BIN = process.env.OPENCODE_BIN || "opencode";
const KILO_BIN = process.env.KILO_BIN || "kilo";

interface SetupState {
  complete?: boolean;
  skipped?: boolean;
  completedAt?: string;
  updatedAt?: string;
}

function readJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return {} as T;
  }
}

function writeState(state: SetupState) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
}

async function hasBinary(name: string): Promise<boolean> {
  try {
    await execFileAsync("which", [name], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function bootstrapReply(message: string): Promise<string> {
  if (await hasBinary(OPENCODE_BIN)) {
    try {
      const { stdout, stderr } = await execFileAsync(OPENCODE_BIN, ["run", message], {
        cwd: homedir(),
        env: { ...process.env, NONINTERACTIVE: "1" },
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      });
      return (stdout || stderr || "OpenCode is ready, but returned no text.").trim();
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      return `OpenCode is installed, but the bootstrap request failed: ${detail}`;
    }
  }

  return [
    "Hi, I'm the AgentOS bootstrap assistant.",
    "OpenCode is the zero-auth path, but I can't find its binary on this machine yet.",
    "You can still finish setup from this page: connect Kilo/Kilro with the buttons, then mark setup complete.",
  ].join(" ");
}

export async function GET() {
  const state = readJson<SetupState>(STATE_FILE);
  const tokens = readJson<Record<string, { at?: string; account?: string }>>(TOKEN_FILE);
  const opencodeReady = await hasBinary(OPENCODE_BIN);
  const kiloReady = await hasBinary(KILO_BIN);
  const kilroReady = Boolean(tokens.kilro || tokens.hermes || tokens.openclaw);
  const kiloConnected = Boolean(tokens.kilo);

  return NextResponse.json({
    complete: Boolean(state.complete),
    skipped: Boolean(state.skipped),
    tools: {
      opencode: { ready: opencodeReady, authRequired: false },
      kilo: { ready: kiloReady, connected: kiloConnected, authRequired: true },
      kilro: { ready: kilroReady, connected: kilroReady, authRequired: true },
    },
    connections: Object.keys(tokens),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body?.action === "complete") {
    writeState({ complete: true, skipped: false, completedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, complete: true });
  }

  if (body?.action === "skip") {
    writeState({ complete: true, skipped: true, completedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, complete: true, skipped: true });
  }

  if (body?.message) {
    const reply = await bootstrapReply(String(body.message));
    return NextResponse.json({ reply, provider: "opencode-bootstrap" });
  }

  return NextResponse.json({ error: "message or action required" }, { status: 400 });
}
