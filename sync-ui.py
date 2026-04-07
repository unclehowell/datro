#!/usr/bin/env python3
"""
Auto-sync for ~/datro/static/ui <-> github.com/unclehowell/datro
- If local is behind remote: auto-pull + sync to web root + telegram alert
- If local is ahead/dirty: push to branch, create/update PR, telegram alert with links
- If local and remote are equal: sync to web root (silent)

Environment variables (set in ~/.bashrc or ~/.profile):
  GITHUB_TOKEN=<your_pat>     Personal access token with repo scope
  TELEGRAM_BOT_TOKEN=<token>  Hermes bot token
  TELEGRAM_CHAT_ID=<id>       Your Telegram chat ID
"""

import subprocess
import os
import json
import sys
import requests

# ── Config ──────────────────────────────────────────────────────────────
REPO_DIR = "/home/ubuntu/datro"
UI_SOURCE = os.path.join(REPO_DIR, "static", "ui")
WEBROOT = "/var/www/datro-ui"
GITHUB_REPO = "unclehowell/datro"
PR_BRANCH = "auto-sync-ui"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
TG_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TG_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

# ── Helpers ─────────────────────────────────────────────────────────────

def sh(cmd, cwd=REPO_DIR, timeout=60):
    r = subprocess.run(cmd, shell=True, cwd=cwd,
                       capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

def notify(msg):
    if not TG_BOT_TOKEN or not TG_CHAT_ID:
        print(msg)
        return
    url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={
            "chat_id": TG_CHAT_ID,
            "text": msg,
            "parse_mode": "HTML"
        }, timeout=10)
    except Exception as e:
        print(f"Telegram failed: {e}")

def sync_to_webroot():
    """Copy UI -> nginx web root, reload, verify."""
    _, err1, rc1 = sh(f"rm -rf {WEBROOT}")
    _, err2, rc2 = sh(f"cp -a {UI_SOURCE} {WEBROOT}")
    if rc1 != 0 or rc2 != 0:
        print(f"sync failed: rm={err1} cp={err2}")
        return False
    sh("systemctl reload nginx")
    # verify
    _, _, rc3 = sh(f"test -f {WEBROOT}/index.html")
    return rc3 == 0


def github_api(path, method="GET", data=None):
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    url = f"https://api.github.com/repos/{GITHUB_REPO}{path}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=15)
        elif method == "POST":
            r = requests.post(url, headers=headers, json=data, timeout=15)
        elif method == "PATCH":
            r = requests.patch(url, headers=headers, json=data, timeout=15)
        else:
            print(f"Unsupported method {method}")
            return None
        if r.status_code >= 400:
            print(f"GitHub API {r.status_code}: {r.text[:200]}")
        return r
    except Exception as e:
        print(f"GitHub API error: {e}")
        return None

def find_open_pr():
    r = github_api(
        f"/pulls?head=unclehowell:{PR_BRANCH}&state=open"
    )
    if r and r.ok:
        prs = r.json()
        if prs:
            return prs[0]
    return None

def create_pr():
    data = {
        "title": "🔄 Auto-sync: UI updates from local environment",
        "head": PR_BRANCH,
        "base": "main",
        "body": (
            "Auto-generated PR from local UI changes.\n\n"
            "**Preview**\n"
            "- Live: https://command.financecheque.uk\n"
            "- (Cloudflare Pages preview will appear here when configured)\n\n"
            "Review and merge if everything looks good."
        )
    }
    r = github_api("/pulls", method="POST", data=data)
    if r and r.ok:
        return r.json()
    return None


# ── Main ────────────────────────────────────────────────────────────────

def main():
    os.chdir(REPO_DIR)
    reports = []
    changed = False

    # Fetch latest
    _, fetch_err, _ = sh("git fetch origin")
    if fetch_err:
        reports.append(f"⚠️ fetch: {fetch_err[:100]}")

    # Determine status
    out_a, _, _ = sh("git rev-list --count origin/main..HEAD")
    out_b, _, _ = sh("git rev-list --count HEAD..origin/main")
    out_dirty, _, _ = sh("git status --porcelain")
    try:
        ahead = int(out_a.strip())
    except ValueError:
        ahead = 0
    try:
        behind = int(out_b.strip())
    except ValueError:
        behind = 0
    dirty = bool(out_dirty.strip())

    reports.append(f"State: ahead={ahead}, behind={behind}, dirty={dirty}")

    # ── Scenario 1: local behind remote → auto-pull ──
    if behind > 0:
        _, pull_out, pull_rc = sh("git pull origin main --ff-only")
        if pull_rc == 0:
            reports.append(f"✅ Pulled {behind} commit(s) from remote")
            changed = True
        else:
            # FF-only failed, try normal pull
            _, pull2, pull2_rc = sh("git pull origin main")
            if pull2_rc == 0:
                reports.append(f"✅ Pulled {behind} commit(s) from remote")
                changed = True
            else:
                reports.append(f"❌ Pull failed: {pull2[:150]}")

    # ── Scenario 2: local ahead or dirty → push to branch + PR ──
    if ahead > 0 or dirty:
        reports.append("Pushing to auto-sync branch...")
        # ensure we're on the right branch or stash
        if dirty:
            sh("git add -A")
            sh("git commit -m 'ui: local changes'")

        # Create/update PR branch
        sh(f"git checkout -B {PR_BRANCH}")
        sh("git push origin main --tags || true")

        # Rebase PR branch onto latest main
        sh("git fetch origin main")
        rebase_out, rebase_err, rebase_rc = sh(
            f"git rebase origin/main"
        )
        if rebase_rc != 0:
            # force push anyway
            sh(f"git push -f origin {PR_BRANCH}")
        else:
            sh(f"git push -f origin {PR_BRANCH}")

        reports.append(f"✅ Pushed to branch {PR_BRANCH}")
        changed = True

        # find or create PR
        pr = find_open_pr()
        if pr:
            reports.append(f"🔗 PR exists: {pr['html_url']}")
            # add new commit comment
            github_api(f"/pulls/{pr['number']}/update-branch", method="PUT")
            # delete temp branch
            sh("git checkout main")
        else:
            # Switch back to main first
            sh("git checkout main")
            pr_resp = create_pr()
            if pr_resp:
                reports.append(f"📝 New PR: {pr_resp.get('html_url', '?')}")
            else:
                reports.append("⚠️ PR creation failed (check GITHUB_TOKEN permissions)")

    # ── Always sync UI -> webroot ──
    if sync_to_webroot():
        reports.append("🌐 UI synced to web root")
    else:
        reports.append("❌ UI sync failed")

    # ── Telegram notification ──
    if changed:
        msg = "<b>🔄 Datro UI Sync Report</b>\n\n"
        msg += "\n".join(reports)
        notify(msg)
    else:
        print("No changes, UI in sync")
        # still sync to webroot (silent, done above)
        print("UI synced to web root (no changes detected)")


if __name__ == "__main__":
    main()
