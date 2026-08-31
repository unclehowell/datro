// ─── LLM Stack Gate ────────────────────────────────────────────
// Idle-on-demand control for the local inference stack:
//   ollama   (system service, port 11434, minicpm5-32k = "mini5 1B")
//   omniroute(user service, port 20128 — the OpenAI-compatible proxy
//            the webgui chat / child proxy actually use)
// The stack stays dormant until a prompt arrives; ensureLLMStack()
// cold-starts it, waits until it is actually ready, and only then is
// the prompt allowed through. An OFF action or an idle timeout
// (default 30 min) shuts it back down.
// ────────────────────────────────────────────────────────────────

import { execFile } from "child_process";
import { promisify } from "util";
import net from "net";

const execFileAsync = promisify(execFile);

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const OMNIROUTE_PORT = 20128;
const MODEL = process.env.LLM_GATE_MODEL || "minicpm5-32k";
const IDLE_TIMEOUT_MS = (parseInt(process.env.LLM_IDLE_TIMEOUT_MIN || "30", 10) || 30) * 60_000;
const START_TIMEOUT_MS = parseInt(process.env.LLM_START_TIMEOUT_S || "180", 10) * 1000;
const WARM_TIMEOUT_MS = parseInt(process.env.LLM_WARM_TIMEOUT_S || "600", 10) * 1000;
const WATCHDOG_MS = 15_000;

export interface GateState {
  state: "starting" | "up" | "down";
  ollama: boolean;
  omniroute: boolean;
  warm: boolean;
  busy: boolean;
  lastPromptAt: number;
  idleTimeoutMs: number;
  idleRemainingMs: number;
  message?: string;
}

let lastPromptAt = 0;
let busy = false;
let warm = false;
let inflight = 0;
let startPromise: Promise<GateState> | null = null;
let watchdogStarted = false;

function ensureRuntimeEnv(): void {
  if (!process.env.XDG_RUNTIME_DIR) {
    const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
    if (uid !== undefined) process.env.XDG_RUNTIME_DIR = `/run/user/${uid}`;
  }
}

function isPortOpen(port: number, host = OLLAMA_HOST, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => { sock.destroy(); resolve(true); });
    sock.once("timeout", () => { sock.destroy(); resolve(false); });
    sock.once("error", () => resolve(false));
  });
}

async function run(cmd: string, args: string[], timeoutMs = 90_000): Promise<{ ok: boolean; err?: string }> {
  try {
    await execFileAsync(cmd, args, { timeout: timeoutMs });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, err: e?.message || String(e) };
  }
}

// ─── Service primitives ────────────────────────────────────────

export async function userServiceActive(name: string): Promise<boolean> {
  ensureRuntimeEnv();
  try {
    const { stdout } = await execFileAsync("systemctl", ["--user", "is-active", `${name}.service`], { timeout: 10_000 });
    return stdout.trim() === "active";
  } catch {
    return false;
  }
}

export async function userService(name: string, action: "start" | "stop" | "restart"): Promise<{ ok: boolean; err?: string }> {
  ensureRuntimeEnv();
  return run("systemctl", ["--user", action, `${name}.service`], 90_000);
}

async function systemServiceActive(name: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("systemctl", ["is-active", `${name}.service`], { timeout: 10_000 });
    return stdout.trim() === "active";
  } catch {
    return false;
  }
}

async function systemService(name: string, action: "start" | "stop" | "restart"): Promise<{ ok: boolean; err?: string }> {
  return run("sudo", ["-n", "systemctl", action, `${name}.service`], 90_000);
}

// ─── Stack helpers ─────────────────────────────────────────────

export function touch(): void {
  lastPromptAt = Date.now();
}

// Mark an actual LLM request as in-flight. The idle watchdog will never
// shut the stack down while a completion is being served (cold model loads
// on this hardware can take minutes, and aborting them mid-answer wastes
// everything). Call endLLMRequest() from the same caller once done.
export function beginLLMRequest(): void {
  inflight += 1;
  touch();
}

export function endLLMRequest(): void {
  inflight = Math.max(0, inflight - 1);
}

export function isBusy(): boolean {
  return busy || startPromise !== null || inflight > 0;
}

async function startOllama(): Promise<void> {
  if (await systemServiceActive("ollama")) return;
  await systemService("ollama", "start");
}

async function stopOllama(): Promise<void> {
  if (!(await systemServiceActive("ollama"))) return;
  await systemService("ollama", "stop");
}

async function startOmniroute(): Promise<void> {
  if (await userServiceActive("omniroute")) return;
  await userService("omniroute", "start");
}

async function stopOmniroute(): Promise<void> {
  if (!(await userServiceActive("omniroute"))) return;
  await userService("omniroute", "stop");
}

async function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return isPortOpen(port);
}

async function warmStack(): Promise<boolean> {
  if (warm) return true;
  try {
    const res = await fetch(`http://${OLLAMA_HOST}:${OMNIROUTE_PORT}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 4,
        stream: false,
      }),
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
    });
    const ok = res.ok;
    warm = ok;
    return ok;
  } catch {
    warm = false;
    return false;
  }
}

export async function getGateState(): Promise<GateState> {
  const [ollamaUp, omniUp] = await Promise.all([isPortOpen(OLLAMA_PORT), isPortOpen(OMNIROUTE_PORT)]);
  const idleRemainingMs = Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - lastPromptAt));
  return {
    state: isBusy() ? "starting" : ollamaUp && omniUp ? "up" : "down",
    ollama: ollamaUp,
    omniroute: omniUp,
    warm,
    busy: isBusy(),
    lastPromptAt,
    idleTimeoutMs: IDLE_TIMEOUT_MS,
    idleRemainingMs,
  };
}

// Start the stack (idempotent, cold-start aware). The prompt is only
// allowed to proceed once ollama + omniroute are reachable and warmed.
export async function ensureLLMStack(): Promise<GateState> {
  touch();
  if (startPromise) return startPromise;

  busy = true;
  startPromise = (async () => {
    const note = async (msg: string): Promise<GateState> => ({ ...(await getGateState()), message: msg });
    try {
      await startOmniroute();
      await startOllama();
      const up = await waitForPort(OLLAMA_PORT, START_TIMEOUT_MS);
      if (!up) return note("ollama did not come up");
      await waitForPort(OMNIROUTE_PORT, 30_000);
      await warmStack();
      return note(warm ? "ready" : "ready (cold start not warmed)");
    } catch (e: any) {
      return note(`gate error: ${e?.message || e}`);
    } finally {
      busy = false;
      startPromise = null;
    }
  })();

  return startPromise;
}

export async function shutdownLLMStack(reason = "manual"): Promise<GateState> {
  if (isBusy()) {
    const state = await getGateState();
    state.message = `busy — cannot stop while a request is running (${reason})`;
    return state;
  }
  await stopOmniroute();
  await stopOllama();
  warm = false;
  return { ...(await getGateState()), message: `stopped (${reason})` };
}

// ─── Idle watchdog ─────────────────────────────────────────────
// After a prompt, if nothing is submitted for IDLE_TIMEOUT_MS the
// stack is put back to sleep so it does not sit running forever.
function startWatchdog(): void {
  if (watchdogStarted) return;
  watchdogStarted = true;
  setInterval(async () => {
    if (isBusy()) return;
    if (lastPromptAt === 0) return;
    if (Date.now() - lastPromptAt > IDLE_TIMEOUT_MS) {
      await shutdownLLMStack("idle");
    }
  }, WATCHDOG_MS);
}

startWatchdog();
