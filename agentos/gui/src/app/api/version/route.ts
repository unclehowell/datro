import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const STATUS_FILE = join(homedir(), ".fcukproxy", ".update-status");
const GITHUB_REPO = "unclehowell/datro";
const GITHUB_BRANCH = "financecheque";

async function githubReleasesFc(): Promise<{ tag: string; url: string } | null> {
  try {
    const resp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`,
      { signal: AbortSignal.timeout(8000), headers: { "Accept": "application/vnd.github.v3+json" } },
    );
    if (!resp.ok) return null;
    const releases: any[] = await resp.json();
    // The list order is not guaranteed to be version-sorted — pick the newest
    // financecheque release by semantic version, not the first match.
    let best: any = null;
    let bestVer: number[] = [];
    for (const r of releases) {
      const tag = r?.tag_name ?? "";
      if (!tag.startsWith("financecheque-v")) continue;
      const ver = (tag.replace(/^financecheque-v/, "").replace(/^v/, ""))
        .split(".").map((p: string) => parseInt(p, 10) || 0);
      if (ver.length === 0) continue;
      if (!best || compareVer(ver, bestVer) > 0) {
        best = r;
        bestVer = ver;
      }
    }
    if (best?.tag_name && best?.html_url) {
      return { tag: best.tag_name, url: best.html_url };
    }
  } catch {}
  return null;
}

function compareVer(a: number[], b: number[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
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

  // Fetch latest GitHub release (unauthenticated API — no gh CLI needed)
  let latestRelease = "unknown";
  let releaseUrl = "";
  const releaseTag = `financecheque-v${localVersion}`;
  try {
    const fc = await githubReleasesFc();
    if (fc) {
      latestRelease = fc.tag.replace(/^financecheque-v/, "").replace(/^v/, "");
      releaseUrl = fc.url;
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
    // A stale terminal status (e.g. a failed attempt from an older version)
    // must not surface once the node is already up to date.
    if (upToDate && updateState !== "updating") {
      updateState = "idle";
      updateTo = undefined;
    }
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
