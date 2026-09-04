// v1.11.30: nothing in this stack wrote to a real, persistent, greppable
// log file — only console.log, which on a systemd/pm2-managed service goes
// to journald or a pm2 log a user has to already know the command for.
// This gives every part of the app one predictable place to look:
//
//   ~/.fcukproxy/logs/agentos-gui.log
//
// Deliberately simple: one JSON object per line, append-only, rotated once
// to agentos-gui.log.1 when it crosses LOG_MAX_BYTES (this is a diagnostic
// tail for "what just happened", not an archive — see the storage
// contract in AGENTS.md for why this stack keeps state deliberately
// small). Never throws — a logging failure must never take down the
// request it's describing.

import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const LOG_DIR = join(homedir(), ".fcukproxy", "logs");
const LOG_FILE = join(LOG_DIR, "agentos-gui.log");
const LOG_MAX_BYTES = 5 * 1024 * 1024; // 5MB

let dirEnsured = false;
function ensureDir(): void {
  if (dirEnsured) return;
  try {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // If this fails we just skip the file write below — console.log still
    // happens, so nothing is silently lost, just not persisted.
  }
  dirEnsured = true;
}

function rotateIfNeeded(): void {
  try {
    if (existsSync(LOG_FILE) && statSync(LOG_FILE).size > LOG_MAX_BYTES) {
      renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {}
}

/**
 * Append one structured log line and echo it to the console (pm2/journald
 * still capture the console line, so this is additive, not a replacement).
 */
export function log(scope: string, message: string, extra?: Record<string, unknown>): void {
  console.log(`[${scope}] ${message}`);
  try {
    ensureDir();
    rotateIfNeeded();
    const line = JSON.stringify({ t: new Date().toISOString(), scope, message, ...(extra || {}) });
    appendFileSync(LOG_FILE, line + "\n");
  } catch {
    // Never let logging break the request it's describing.
  }
}
