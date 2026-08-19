import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export async function GET() {
  const localVersionFile = join(homedir(), ".fcukproxy", ".local-version");
  const localVersion = existsSync(localVersionFile)
    ? readFileSync(localVersionFile, "utf-8").trim()
    : "unknown";

  // Try to fetch latest from parent
  let remoteVersion = "unknown";
  let parentReachable = false;
  try {
    const resp = await fetch("https://www.financecheque.uk/api/version", {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const data = await resp.json();
      remoteVersion = data.version || "unknown";
      parentReachable = true;
    }
  } catch {}

  const upToDate = localVersion === remoteVersion || remoteVersion === "unknown";

  return NextResponse.json({
    local: localVersion,
    remote: remoteVersion,
    upToDate,
    parentReachable,
    branch: "financecheque",
    checked: new Date().toISOString(),
  });
}
