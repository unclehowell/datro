// ============================================================
// /api/logs — read child proxy / agent logs
// ============================================================
// GET ?file=agent.log&lines=200  → returns last N lines of named log
// GET ?action=list               → returns list of available log files
//
// v1.11.30: this route now reads two backing stores:
//   1. Fixed log files under ~/.fcukproxy/logs/*.log — written by the
//      install.sh service units via StandardOutput=append:...
//   2. journalctl --user — as a fallback for any service whose unit
//      file was created before the append: directive landed. The
//      journal fallback makes the log viewer useful on upgrades from
//      older installations where services were already writing to
//      systemd's journal.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";
import { homedir } from "os";

const FCUK_DIR = join(homedir(), ".fcukproxy");
const LOGS_DIR = join(FCUK_DIR, "logs");
mkdirSync(LOGS_DIR, { recursive: true });

const FILE_LOGS = [
  "agentos-gui.log",
  "task-router.log",
  "omniroute.log",
  "whisper-stt.log",
  "openclaw-gateway.log",
  "graphrag.log",
  "child-proxy.log",
  "phone_chat.log",
  "hermes-proxy.log",
  "hermes-local.log",
  "ota-update.log",
];

// systemd unit names we can pull from the journal as a fallback.
const JOURNAL_UNITS = [
  "agentos-gui.service",
  "task-router.service",
  "omniroute.service",
  "whisper-stt.service",
  "fcukproxy-child.service",
  "openclaw-gateway.service",
] as const;

// Pseudo file names for journal-backed services, e.g.
// "agentos-gui.service.log". Used in both the list and read paths.
const JOURNAL_PSEUDOS = JOURNAL_UNITS.map((u) => `${u}.log`);

function safeLogPath(name: string): string | null {
  if (name.includes("/") || name.includes("..") || name.startsWith("/")) return null;
  // Accept both real log filenames and journal pseudo-filenames.
  if (FILE_LOGS.includes(name)) return join(LOGS_DIR, name);
  if (JOURNAL_PSEUDOS.includes(name)) return join(LOGS_DIR, name); // may not exist; callers fall back to journal
  return null;
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "list";
  const requestedFile = req.nextUrl.searchParams.get("file");
  const lines = Math.min(parseInt(req.nextUrl.searchParams.get("lines") || "200", 10), 2000);

  if (action === "list") {
    const seen = new Set<string>();
    const files = [];
    // 1. File-based logs
    for (const name of FILE_LOGS) {
      const fullPath = join(LOGS_DIR, name);
      if (!existsSync(fullPath)) {
        // Try the old ~/.fcukproxy/ path (pre-v1.11.30 installs)
        const legacy = join(FCUK_DIR, name.replace("-v1.11.30", ""));
        if (!existsSync(legacy)) continue;
      }
      try {
        const stat = statSync(fullPath);
        seen.add(name);
        files.push({
          name,
          size: stat.size,
          modified: stat.mtime.toISOString(),
          source: "file",
        });
      } catch {}
    }
    // 2. Journal sources as pseudo-entries
    for (const unit of JOURNAL_UNITS) {
      const pseudo = `${unit}.log`;
      if (seen.has(pseudo)) continue;
      seen.add(pseudo);
      files.push({ name: pseudo, size: 0, modified: "journal", source: "journal" });
    }
    return NextResponse.json({ ok: true, files });
  }


  if (action === "read" && requestedFile) {
    const path = safeLogPath(requestedFile);
    if (!path) {
      return NextResponse.json({ error: "Invalid or disallowed log file" }, { status: 400 });
    }
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, "utf8");
        const allLines = content.split("\n");
        const tail = allLines.slice(-lines).join("\n");
        return NextResponse.json({
          ok: true,
          file: requestedFile,
          source: "file",
          totalLines: allLines.length,
          returnedLines: Math.min(lines, allLines.length),
          content: tail,
        });
      } catch (e: any) {
        return NextResponse.json({ error: `Could not read log: ${e.message}` }, { status: 500 });
      }
    }
    // v1.11.30 fallback: if the log file doesn't exist (older install
    // that wrote to journal only), try journalctl --user -u <unit> -n N
    const unitName = requestedFile.replace(/\.log$/, "");
    if (JOURNAL_UNITS.some((u) => u === unitName)) {
      try {
        const result = spawnSync(
          "journalctl",
          ["--user", "-u", unitName, "-n", String(lines), "--no-pager", "-o", "cat"],
          { encoding: "utf8", timeout: 10_000 },
        );
        if (result.status === 0 && result.stdout) {
          const allLines = result.stdout.split("\n").filter(Boolean);
          return NextResponse.json({
            ok: true,
            file: requestedFile,
            source: "journal",
            totalLines: allLines.length,
            returnedLines: Math.min(lines, allLines.length),
            content: allLines.slice(-lines).join("\n"),
          });
        }
      } catch {
        // journalctl not available (e.g. on Termux) — fall through
      }
    }
    return NextResponse.json({ error: "Log file not found and no journal source", file: requestedFile }, { status: 404 });
  }

  return NextResponse.json({ error: "Unknown action. Use ?action=list or ?action=read" }, { status: 400 });
}
