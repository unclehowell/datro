#!/usr/bin/env bash
# FCUK Flywheel — Over-The-Air (OTA) self-update script
set -euo pipefail

LOGFILE="/home/ubuntu/logs/ota-update.log"
REPO_DIR="/home/ubuntu/datro"
FCUK_DIR="/home/ubuntu/.fcukproxy"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"; }

mkdir -p "$(dirname "$LOGFILE")"

cd "$REPO_DIR"
log "Syncing branches from origin..."
git fetch origin cnei financecheque --quiet

# 1. Update Flywheel logic from 'cnei' branch
log "Updating flywheel logic from 'cnei' branch..."
git show origin/cnei:flywheel/multi-branch-release.sh > "$FCUK_DIR/multi-branch-release.sh.tmp" && mv "$FCUK_DIR/multi-branch-release.sh.tmp" "$FCUK_DIR/multi-branch-release.sh"
git show origin/cnei:flywheel/intelligence.py > "$FCUK_DIR/intelligence.py.tmp" && mv "$FCUK_DIR/intelligence.py.tmp" "$FCUK_DIR/intelligence.py"
chmod +x "$FCUK_DIR/multi-branch-release.sh" "$FCUK_DIR/intelligence.py"

# Update agent context/harness
mkdir -p "$FCUK_DIR/agent/branches" "$FCUK_DIR/agent/masters"
git show origin/cnei:flywheel/agent/soul.md > "$FCUK_DIR/agent/soul.md.tmp" && mv "$FCUK_DIR/agent/soul.md.tmp" "$FCUK_DIR/agent/soul.md"
git show origin/cnei:flywheel/agent/manifest.md > "$FCUK_DIR/agent/manifest.md.tmp" && mv "$FCUK_DIR/agent/manifest.md.tmp" "$FCUK_DIR/agent/manifest.md"

# Update all master plans
log "Updating master plans..."
git ls-tree -r origin/cnei --name-only | grep 'flywheel/agent/masters/' | while read -r plan_path; do
    filename=$(basename "$plan_path")
    git show "origin/cnei:$plan_path" > "$FCUK_DIR/agent/masters/$filename.tmp" && mv "$FCUK_DIR/agent/masters/$filename.tmp" "$FCUK_DIR/agent/masters/$filename"
done

# 2. Update Proxy Agent from 'financecheque' branch
log "Updating proxy agent from 'financecheque' branch..."
git show origin/financecheque:static/financecheque/public/fcukproxy/agent.py > "$FCUK_DIR/agent.py.tmp" && mv "$FCUK_DIR/agent.py.tmp" "$FCUK_DIR/agent.py"
git show origin/financecheque:static/financecheque/public/fcukproxy/gui.py > "$FCUK_DIR/gui.py.tmp" && mv "$FCUK_DIR/gui.py.tmp" "$FCUK_DIR/gui.py"
git show origin/financecheque:static/financecheque/public/fcukproxy/install.sh > "$FCUK_DIR/install.sh.tmp" && mv "$FCUK_DIR/install.sh.tmp" "$FCUK_DIR/install.sh"

# 3. Recursive improvement: Check for missing tools and install them
log "Checking for intelligence tools..."
for tool in kiro kilo groq opencode; do
  if ! command -v "$tool" &>/dev/null; then
    log "Missing $tool — running installer..."
    git show origin/financecheque:static/financecheque/public/install.sh | sudo bash -s -- --quiet 2>/dev/null || true
    break
  fi
done

log "OTA Update complete."
