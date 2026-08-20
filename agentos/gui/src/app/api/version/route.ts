import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";

const STATUS_FILE = join(homedir(), ".fcukproxy", ".update-status");
const GITHUB_REPO = "unclehowell/datro";
const GITHUB_BRANCH = "financecheque";

function ghReleaseUrl(tag: string): string | null {
  try {
    const out = execSync(`gh release view "${tag}" --repo ${GITHUB_REPO} --json url -q .url`, {
      timeout: 8000,
      encoding: "utf-8",
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

function ghLatestFcRelease(): { tag: string; url: string } | null {
  try {
    const out = execSync(`gh release list --repo ${GITHUB_REPO} --limit 10 --json tagName,url -q '[.[] | select(.tagName | startswith("financecheque-v"))][0]'`, {
      timeout: 8000,
      encoding: "utf-8",
    });
    const parsed = JSON.parse(out);
    if (parsed?.tagName && parsed?.url) {
      return { tag: parsed.tagName, url: parsed.url };
    }
  } catch {}
  return null;
}

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

  // Fetch latest GitHub release for financecheque branch via gh CLI (authenticated)
  let latestRelease = "unknown";
  let releaseUrl = "";
  const releaseTag = `financecheque-v${localVersion}`;
  try {
    const url = ghReleaseUrl(releaseTag);
    if (url) {
      latestRelease = localVersion;
      releaseUrl = url;
    }
  } catch {}
  if (latestRelease === "unknown") {
    try {
      const latest = ghLatestFcRelease();
      if (latest) {
        latestRelease = latest.tag.replace(/^financecheque-v/, "").replace(/^v/, "");
        releaseUrl = latest.url;
      }
    } catch {}
  }

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
