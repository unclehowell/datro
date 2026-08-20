import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { spawn } from "child_process";

const STATUS_FILE = join(homedir(), ".fcukproxy", ".update-status");
const CHECKER_SCRIPT = join(homedir(), ".fcukproxy", "update-checker.sh");

interface UpdateStatus {
  state: "idle" | "updating" | "done" | "error";
  from?: string;
  to?: string;
  started?: string;
  finished?: string;
  log?: string;
  error?: string;
}

function readStatus(): UpdateStatus {
  if (existsSync(STATUS_FILE)) {
    try {
      return JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
    } catch {}
  }
  return { state: "idle" };
}

function writeStatus(s: UpdateStatus) {
  writeFileSync(STATUS_FILE, JSON.stringify(s, null, 2));
}

// POST /api/update — trigger an update
export async function POST() {
  const current = readStatus();

  // Already updating — return current status
  if (current.state === "updating") {
    return NextResponse.json(current, { status: 409 });
  }

  // Read local + remote versions
  const localVersionFile = join(homedir(), ".fcukproxy", ".local-version");
  const localVersion = existsSync(localVersionFile)
    ? readFileSync(localVersionFile, "utf-8").trim()
    : "unknown";

  let remoteVersion = "unknown";
  try {
    const resp = await fetch("https://www.financecheque.uk/api/version", {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const data = await resp.json();
      remoteVersion = data.version || "unknown";
    }
  } catch {}

  if (remoteVersion === "unknown") {
    return NextResponse.json(
      { state: "error", error: "Cannot reach parent server" },
      { status: 503 }
    );
  }

  if (localVersion === remoteVersion) {
    return NextResponse.json(
      { state: "idle", from: localVersion, to: remoteVersion },
      { status: 200 }
    );
  }

  // Start the update in background
  const status: UpdateStatus = {
    state: "updating",
    from: localVersion,
    to: remoteVersion,
    started: new Date().toISOString(),
  };
  writeStatus(status);

  // Spawn update script detached — it runs independently
  const child = spawn("bash", [CHECKER_SCRIPT], {
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      HOME: homedir(),
      PATH: `${homedir()}/.local/node/bin:${process.env.PATH}`,
    },
  });

  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
  child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

  child.on("close", (code) => {
    const final: UpdateStatus = {
      state: code === 0 ? "done" : "error",
      from: localVersion,
      to: remoteVersion,
      started: status.started,
      finished: new Date().toISOString(),
      log: stdout.slice(-2000),
      error: code !== 0 ? stderr.slice(-500) : undefined,
    };
    writeStatus(final);
  });

  child.on("error", (err) => {
    writeStatus({
      state: "error",
      from: localVersion,
      to: remoteVersion,
      started: status.started,
      finished: new Date().toISOString(),
      error: err.message,
    });
  });

  child.unref();

  return NextResponse.json(status, { status: 202 });
}

// GET /api/update — check update status
export async function GET() {
  return NextResponse.json(readStatus());
}
