import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const STATUS_FILE = join(homedir(), ".fcukproxy", ".update-status");
const GITHUB_REPO = "unclehowell/datro";
const GITHUB_BRANCH = "financecheque";

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

  // Fetch latest GitHub release for financecheque branch
  let latestRelease = "unknown";
  let releaseUrl = "";
  const releaseTag = `financecheque-v${localVersion}`;
  try {
    // Try the specific tag first, then fall back to latest
    let resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${releaseTag}`, {
      signal: AbortSignal.timeout(5000),
      headers: { "Accept": "application/vnd.github.v3+json" },
    });
    if (!resp.ok) {
      // Try fetching all releases and find the newest financecheque one
      resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`, {
        signal: AbortSignal.timeout(5000),
        headers: { "Accept": "application/vnd.github.v3+json" },
      });
      if (resp.ok) {
        const releases = await resp.json();
        const fcRelease = Array.isArray(releases)
          ? releases.find((r: any) => (r.tag_name || "").startsWith("financecheque-v"))
          : null;
        if (fcRelease) {
          latestRelease = (fcRelease.tag_name || "").replace(/^financecheque-v/, "").replace(/^v/, "");
          releaseUrl = fcRelease.html_url || "";
        }
      }
    } else {
      const data = await resp.json();
      latestRelease = (data.tag_name || "").replace(/^financecheque-v/, "").replace(/^v/, "");
      releaseUrl = data.html_url || "";
    }
  } catch {}

  // Fallback: if no GitHub releases, try the branch .version via raw
  if (latestRelease === "unknown") {
    try {
      const resp = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/.version`, {
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        latestRelease = (await resp.text()).trim();
      }
    } catch {}
  }

  const upToDate = localVersion === remoteVersion || remoteVersion === "unknown";

  // Check if an update is in progress
  let updateState: string = "idle";
  let updateTo: string | undefined;
  if (existsSync(STATUS_FILE)) {
    try {
      const s = JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
      updateState = s.state || "idle";
      updateTo = s.to;
    } catch {}
  }

  return NextResponse.json({
    local: localVersion,
    remote: remoteVersion,
    latestRelease,
    releaseUrl,
    upToDate,
    parentReachable,
    branch: GITHUB_BRANCH,
    update: updateState,
    updateTo,
    checked: new Date().toISOString(),
  });
}
