// v1.11.33 (WS-02): one explicit home for the ~/.fcukproxy state dir.
//
// Background: every process in this stack resolves where state lives with
// `os.homedir()`. That is fine when the GUI and its services are launched by
// the same environment — but on Termux/phone, `homedir()` returns the Termux
// home while the deployed app can be launched from a different base, producing
// TWO real, different `.fcukproxy` directories (the phone defects log:
// logger wrote to one, the logs API read from another). The fix is to stop
// guessing: install.sh (and the service units) export one explicit FCUK_HOME,
// and every call site routes through this module instead of `homedir()`.
//
// Priority:
//   1. process.env.FCUK_HOME, if set (the installer/service source of truth)
//   2. fallback to homedir() so a dev running `next dev` un-configured still works
//
// Prefer fcukJoin("logs", "agentos-gui.log") over string-building so callers
// get path-safe joins for free.
//
// NOTE for the build-time lint gate (WS-13): any NEW `join(homedir(), ".fcukproxy", …)`
// outside this file should fail CI. This module is the single allowed exception.

import { homedir } from "os";
import { join } from "path";

/** The explicit, unified `~/.fcukproxy` base. */
export function fcukHome(): string {
  return process.env.FCUK_HOME || join(homedir(), ".fcukproxy");
}

/** Join path segments beneath the `.fcukproxy` base. */
export function fcukJoin(...segments: string[]): string {
  return join(fcukHome(), ...segments);
}