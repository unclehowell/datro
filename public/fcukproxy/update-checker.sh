#!/bin/bash
# update-checker.sh — OTA self-update for FinanceCheque child proxies
#
# Checks financecheque.uk for new versions, pulls + rebuilds + restarts.
# Designed to run as a systemd timer or cron job.
#
# Flow:
# 1. Fetch /api/version from parent → get latest version
# 2. Compare with local ~/.fcukproxy/.local-version
# 3. If newer: git pull origin financecheque → rebuild → restart services
# 4. Write new version to ~/.fcukproxy/.local-version
#
# Environment:
#   PARENT_URL       — parent server (default: https://www.financecheque.uk)
#   INSTALL_DIR      — where datro repo is cloned (default: ~/.fcukproxy/datro)
#   GUI_DIR          — agentos-gui dir (default: ~/.fcukproxy/agentos-gui)
#   SKIP_REBUILD     — set to 1 to skip npm build (config-only updates)
#   DRY_RUN          — set to 1 to check without applying
set -euo pipefail

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.fcukproxy/datro}"
GUI_DIR="${GUI_DIR:-$HOME/.fcukproxy/agentos-gui}"
LOCAL_VERSION_FILE="$HOME/.fcukproxy/.local-version"
LOG_FILE="$HOME/.fcukproxy/logs/ota-update.log"
NODE_BIN="$HOME/.local/node/bin/node"
NPM_BIN="$HOME/.local/node/bin/npm"
SKIP_REBUILD="${SKIP_REBUILD:-0}"
DRY_RUN="${DRY_RUN:-0}"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$msg" | tee -a "$LOG_FILE"
}

# ── Fetch latest version from parent ──────────────────────────────────────────
fetch_latest_version() {
  local resp
  resp=$(curl -sf --max-time 15 "$PARENT_URL/api/version" 2>/dev/null) || {
    # Fallback: try GitHub raw
    resp=$(curl -sf --max-time 15 "https://raw.githubusercontent.com/unclehowell/datro/financecheque/.version" 2>/dev/null) || {
      log "ERROR: Could not fetch version from parent or GitHub"
      return 1
    }
    echo "$resp" | tr -d '[:space:]'
    return 0
  }
  echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version',''))" 2>/dev/null || echo "$resp" | tr -d '[:space:]'
}

# ── Get local version ─────────────────────────────────────────────────────────
get_local_version() {
  if [[ -f "$LOCAL_VERSION_FILE" ]]; then
    cat "$LOCAL_VERSION_FILE" | tr -d '[:space:]'
  else
    echo "0.0.0"
  fi
}

# ── Version comparison (returns 0 if $1 < $2) ────────────────────────────────
version_lt() {
  local IFS=.
  local i v1=($1) v2=($2)
  for ((i=0; i<${#v2[@]}; i++)); do
    local a="${v1[i]:-0}"
    local b="${v2[i]:-0}"
    if ((a < b)); then return 0; fi
    if ((a > b)); then return 1; fi
  done
  return 1
}

# ── Apply update ──────────────────────────────────────────────────────────────
apply_update() {
  local latest="$1"

  log "Updating from $(get_local_version) → $latest"

  # 1. Git pull the financecheque branch
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    log "Pulling latest code..."
    cd "$INSTALL_DIR"
    git fetch origin financecheque 2>>"$LOG_FILE"
    git reset --hard origin/financecheque 2>>"$LOG_FILE"
    log "Code updated"
  else
    log "WARN: datro repo not at $INSTALL_DIR, skipping git pull"
  fi

  # 2. Copy updated agentos-gui if it exists in the repo
  if [[ -d "$INSTALL_DIR/agentos/gui/src" && -d "$GUI_DIR/src" ]]; then
    log "Syncing agentos-gui..."
    rsync -a --delete \
      --exclude='.next' \
      --exclude='node_modules' \
      --exclude='.git' \
      "$INSTALL_DIR/agentos/gui/" "$GUI_DIR/" 2>>"$LOG_FILE"
    log "GUI source synced"
  fi

  # 3. Copy updated omniroute
  if [[ -f "$INSTALL_DIR/agentos/omniroute/proxy.mjs" ]]; then
    mkdir -p "$HOME/.fcukproxy/omniroute"
    cp "$INSTALL_DIR/agentos/omniroute/proxy.mjs" "$HOME/.fcukproxy/omniroute/proxy.mjs"
    chmod +x "$HOME/.fcukproxy/omniroute/proxy.mjs"
    log "OmniRoute updated"
  fi

  # 4. Copy updated voice-service
  if [[ -f "$INSTALL_DIR/public/fcukproxy/voice-service/server.py" ]]; then
    mkdir -p "$HOME/.local/whisper-stt"
    cp "$INSTALL_DIR/public/fcukproxy/voice-service/server.py" "$HOME/.local/whisper-stt/server.py"
    cp "$INSTALL_DIR/public/fcukproxy/voice-service/realtime-proxy.py" "$HOME/.local/whisper-stt/realtime-proxy.py"
    chmod +x "$HOME/.local/whisper-stt/server.py" "$HOME/.local/whisper-stt/realtime-proxy.py"
    log "Voice service updated"
  fi

  # 5. Rebuild GUI if needed
  if [[ "$SKIP_REBUILD" != "1" && -d "$GUI_DIR/src" ]]; then
    log "Installing GUI dependencies..."
    cd "$GUI_DIR"
    if [[ -f "$NPM_BIN" ]]; then
      PATH="$HOME/.local/node/bin:$PATH" "$NPM_BIN" ci 2>>"$LOG_FILE" | tail -3
      log "Building GUI..."
      PATH="$HOME/.local/node/bin:$PATH" "$HOME/.local/node/bin/npx" next build 2>>"$LOG_FILE" | tail -5
      log "GUI built"
    else
      log "WARN: npm not found, skipping build"
    fi
  fi

  # 6. Restart services
  log "Restarting services..."
  systemctl --user daemon-reload 2>/dev/null || true
  for svc in agentos-gui omniroute whisper-stt whisper-realtime; do
    if systemctl --user is-enabled "$svc.service" >/dev/null 2>&1; then
      systemctl --user restart "$svc.service" 2>/dev/null || true
      log "  Restarted $svc"
    fi
  done

  # 7. Write new local version
  echo "$latest" > "$LOCAL_VERSION_FILE"
  log "Update complete: now at v$latest"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  log "Checking for updates..."

  local latest
  latest=$(fetch_latest_version) || exit 1

  if [[ -z "$latest" ]]; then
    log "ERROR: Empty version from parent"
    exit 1
  fi

  local local_version
  local_version=$(get_local_version)

  log "Local: v$local_version | Remote: v$latest"

  if [[ "$local_version" == "$latest" ]]; then
    log "Already up to date"
    exit 0
  fi

  if ! version_lt "$local_version" "$latest"; then
    log "Local version ($local_version) >= remote ($latest) — skipping"
    exit 0
  fi

  log "Update available: v$local_version → v$latest"

  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY RUN — not applying"
    exit 0
  fi

  apply_update "$latest"
}

main "$@"
