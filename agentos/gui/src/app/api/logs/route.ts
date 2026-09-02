// ============================================================
// /api/logs — read child proxy / agent logs
// ============================================================
// GET ?file=agent.log&lines=200  → returns last N lines of named log
// GET ?action=list               → returns list of available log files
// Files restricted to ~/.fcukproxy/ logs directory
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const LOGS_DIR = join(homedir(), ".fcukproxy", "logs");
const FCUK_DIR = join(homedir(), ".fcukproxy");

const ALLOWED_LOGS = [
  "agent.log",
  "agent-exec.log",
  "boot.log",
  "child-proxy.log",
  "gui-fg.log",
  "ota-update.log",
  "phone_chat.log",
  "hermes-proxy.log",
  "hermes-local.log",
];

function safeLogPath(name: string): string | null {
  // Reject any path traversal or absolute paths
  if (name.includes("/") || name.includes("..") || name.startsWith("/")) return null;
  if (!ALLOWED_LOGS.includes(name)) return null;
  return join(FCUK_DIR, name);
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "list";
  const requestedFile = req.nextUrl.searchParams.get("file");
  const lines = Math.min(parseInt(req.nextUrl.searchParams.get("lines") || "200", 10), 2000);

  if (action === "list") {
    const files = ALLOWED_LOGS
      .map((name) => {
        const fullPath = join(FCUK_DIR, name);
        if (!existsSync(fullPath)) return null;
        try {
          const stat = statSync(fullPath);
          return {
            name,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            path: fullPath,
          };
        } catch {
          return null;
        }
      })
      .filter((f): f is { name: string; size: number; modified: string; path: string } => f !== null);
    return NextResponse.json({ ok: true, files });
  }

  if (action === "read" && requestedFile) {
    const path = safeLogPath(requestedFile);
    if (!path) {
      return NextResponse.json({ error: "Invalid or disallowed log file" }, { status: 400 });
    }
    if (!existsSync(path)) {
      return NextResponse.json({ error: "Log file not found", file: requestedFile }, { status: 404 });
    }
    try {
      const content = readFileSync(path, "utf8");
      const allLines = content.split("\n");
      const tail = allLines.slice(-lines).join("\n");
      return NextResponse.json({
        ok: true,
        file: requestedFile,
        totalLines: allLines.length,
        returnedLines: Math.min(lines, allLines.length),
        content: tail,
      });
    } catch (e: any) {
      return NextResponse.json({ error: `Could not read log: ${e.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action. Use ?action=list or ?action=read" }, { status: 400 });
}
