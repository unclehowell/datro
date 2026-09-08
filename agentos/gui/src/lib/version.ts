import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fcukHome } from "@/lib/fcuk-home";

let cached: string | null = null;

// Read the current AgentOS version at runtime — never hardcode it (the
// release gate check-version-constants.sh forbids the current version literal
// in code). Prefer the node's deployed ~/.fcukproxy/.local-version; fall back
// to the repo .version (DATRO_DIR) so dev/CI runs of the GUI report something
// truthful instead of the checkpoint's static string.
export function currentVersion(): string {
  if (cached) return cached;
  const candidates = [
    join(fcukHome(), ".local-version"),
    join(fcukHome(), "datro", ".version"),
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        const v = readFileSync(p, "utf-8").trim();
        if (v) { cached = v; return v; }
      }
    } catch {}
  }
  // Walk up from the GUI working directory to find the repo .version
  // (dev / standalone GUI where ~/.fcukproxy/.local-version may not exist).
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const p = join(dir, ".version");
    try {
      if (existsSync(p)) {
        const v = readFileSync(p, "utf-8").trim();
        if (v) { cached = v; return v; }
      }
    } catch {}
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  cached = "unknown";
  return cached;
}