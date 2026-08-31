// ─── Whisper STT Gate ───────────────────────────────────────────────
// On-demand control for the local Whisper STT service (port 3101).
// The service is DISABLED by default (no model runs in the background).
// ensureWhisperSTT() cold-starts it the moment a recording needs to be
// transcribed (or a reply needs TTS), waits until the port is actually
// reachable, and only then lets the request through. An idle timeout
// shuts it back down so no model lingers.
// ────────────────────────────────────────────────────────────────────

import { execFile } from "child_process";
import { promisify } from "util";
import net from "net";

const execFileAsync = promisify(execFile);

const WHISPER_HOST = "127.0.0.1";
const WHISPER_PORT = 3101;
const IDLE_TIMEOUT_MS = (parseInt(process.env.WHISPER_IDLE_TIMEOUT_MIN || "10", 10) || 10) * 60_000;
const START_TIMEOUT_MS = parseInt(process.env.WHISPER_START_TIMEOUT_S || "120", 10) * 1000;
const WATCHDOG_MS = 30_000;

let lastUsedAt = 0;
let startingPromise: Promise<boolean> | null = null;
let watchdogStarted = false;
const bootedAt = Date.now();
// When whisper-stt was first observed answering on :3101 in this server
// incarnation. Anchors idle-reaping even when nothing ever touched the
// gate (e.g. a stale instance left running from before a restart) WITHOUT
// killing a freshly-externally-started service seconds later.
let firstUpAtBoot = 0;

function ensureRuntimeEnv(): void {
  if (!process.env.XDG_RUNTIME_DIR) {
    const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
    if (uid !== undefined) process.env.XDG_RUNTIME_DIR = `/run/user/${uid}`;
  }
}

function isPortOpen(port: number, host = WHISPER_HOST, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => { sock.destroy(); resolve(true); });
    sock.once("timeout", () => { sock.destroy(); resolve(false); });
    sock.once("error", () => resolve(false));
  });
}

async function svcStart(): Promise<{ ok: boolean; err?: string }> {
  ensureRuntimeEnv();
  try {
    await execFileAsync("systemctl", ["--user", "start", "whisper-stt.service"], { timeout: 90_000 });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, err: e?.message || String(e) };
  }
}

async function svcStop(): Promise<{ ok: boolean; err?: string }> {
  ensureRuntimeEnv();
  try {
    await execFileAsync("systemctl", ["--user", "stop", "whisper-stt.service"], { timeout: 60_000 });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, err: e?.message || String(e) };
  }
}

/** Record activity so the idle watchdog does not stop us mid-reply. */
export function touchWhisper(): void {
  lastUsedAt = Date.now();
}

/** True if the STT service is currently reachable. */
export async function isWhisperUp(): Promise<boolean> {
  return isPortOpen(WHISPER_PORT);
}

/**
 * Ensure the local Whisper STT server is running and answering on :3101.
 * Idempotent + concurrency-safe: concurrent callers share one cold-start.
 */
export async function ensureWhisperSTT(): Promise<{ ok: boolean; message?: string }> {
  touchWhisper();
  if (await isPortOpen(WHISPER_PORT)) return { ok: true };

  if (startingPromise) return startingPromise.then((ok) => ({ ok, message: ok ? undefined : "whisper did not come up" }));

  startingPromise = (async () => {
    const res = await svcStart();
    if (!res.ok) {
      console.log(`[whisper-gate] start failed: ${res.err}`);
      return false;
    }
    const deadline = Date.now() + START_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (await isPortOpen(WHISPER_PORT)) {
        touchWhisper();
        return true;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return isPortOpen(WHISPER_PORT);
  })();

  try {
    return await startingPromise.then((ok) => ({ ok, message: ok ? undefined : "whisper did not come up" }));
  } finally {
    startingPromise = null;
  }
}

/** Best-effort shutdown; used by the idle watchdog / explicit stop. */
export async function shutdownWhisperSTT(reason = "idle"): Promise<void> {
  if (startingPromise) return;
  await svcStop();
  console.log(`[whisper-gate] stopped (${reason})`);
}

function startWatchdog(): void {
  if (watchdogStarted) return;
  watchdogStarted = true;
  setInterval(async () => {
    if (startingPromise) return;
    const up = await isPortOpen(WHISPER_PORT);
    if (up) {
      if (firstUpAtBoot === 0) firstUpAtBoot = Date.now();
    } else {
      firstUpAtBoot = 0;
      lastUsedAt = 0;
      return;
    }
    // Reap an untended instance after a full idle window: the baseline is
    // the last gate use, or (if never used) when it was first seen up this
    // boot. Never less than IDLE_TIMEOUT after it appeared.
    const idleSince = lastUsedAt || firstUpAtBoot || bootedAt;
    if (Date.now() - idleSince > IDLE_TIMEOUT_MS) {
      lastUsedAt = 0;
      await shutdownWhisperSTT("idle");
    }
  }, WATCHDOG_MS);
}

startWatchdog();