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

# ── Fetch latest version from parent (+ GitHub fallback) ─────────────────────
fetch_latest_version() {
  local parent_version=""
  local github_version=""

  # 1. Try parent API
  local resp
  resp=$(curl -sf --max-time 15 "$PARENT_URL/api/version" 2>/dev/null) && {
    parent_version=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version',''))" 2>/dev/null || echo "$resp" | tr -d '[:space:]')
  }

  # 2. Always try GitHub raw (may be newer than parent if deploy is pending)
  resp=$(curl -sf --max-time 15 "https://raw.githubusercontent.com/unclehowell/datro/financecheque/.version" 2>/dev/null) && {
    github_version=$(echo "$resp" | tr -d '[:space:]')
  }

  # 3. Return whichever is newer
  if [[ -n "$parent_version" && -n "$github_version" ]]; then
    if version_lt "$parent_version" "$github_version"; then
      log "GitHub version ($github_version) newer than parent ($parent_version)"
      echo "$github_version"
    else
      echo "$parent_version"
    fi
  elif [[ -n "$parent_version" ]]; then
    echo "$parent_version"
  elif [[ -n "$github_version" ]]; then
    echo "$github_version"
  else
    log "ERROR: Could not fetch version from parent or GitHub"
    return 1
  fi
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

# ── Regenerate systemd services from repo install.sh ─────────────────────────
# This ensures install.sh changes (memory limits, new services, etc.) propagate
# to deployed nodes via OTA — not just code changes.
regenerate_services() {
  local SYSTEMD_DIR="$HOME/.config/systemd/user"
  mkdir -p "$SYSTEMD_DIR"

  local VENV_DIR="$HOME/.local/whisper-stt-venv"
  local WHISPER_DIR="$HOME/.local/whisper-stt"
  local OMNIRUTE_DIR="$HOME/.fcukproxy/omniroute"
  local NODE_BIN="$HOME/.local/node/bin/node"
  local OPENCLAW_BIN="$HOME/.local/lib/node_modules/openclaw/dist/index.js"

  # Read version from repo
  local REPO_VERSION
  REPO_VERSION=$(cat "$INSTALL_DIR/.version" 2>/dev/null | tr -d '[:space:]') || REPO_VERSION="1.0.0"

  # ── Detect RAM and compute adaptive memory limits ──
  local TOTAL_RAM_MB
  TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo 4096)

  local MEM_WHISPER_MAX MEM_WHISPER_HIGH MEM_AGENTOS_MAX MEM_AGENTOS_HIGH MEM_AGENTOS_OOM
  local MEM_OMNIRUTE_MAX MEM_OMNIRUTE_HIGH MEM_GATEWAY_MAX MEM_GATEWAY_HIGH MEM_GATEWAY_OOM

  if [[ "$TOTAL_RAM_MB" -le 4096 ]]; then
    MEM_WHISPER_MAX="192M";    MEM_WHISPER_HIGH="128M"
    MEM_AGENTOS_MAX="96M";     MEM_AGENTOS_HIGH="64M";     MEM_AGENTOS_OOM="500"
    MEM_OMNIRUTE_MAX="256M";   MEM_OMNIRUTE_HIGH="192M"
    MEM_GATEWAY_MAX="384M";    MEM_GATEWAY_HIGH="256M";    MEM_GATEWAY_OOM="-100"
  else
    MEM_WHISPER_MAX="256M";    MEM_WHISPER_HIGH="192M"
    MEM_AGENTOS_MAX="128M";    MEM_AGENTOS_HIGH="96M";     MEM_AGENTOS_OOM="500"
    MEM_OMNIRUTE_MAX="512M";   MEM_OMNIRUTE_HIGH="384M"
    MEM_GATEWAY_MAX="512M";    MEM_GATEWAY_HIGH="384M";    MEM_GATEWAY_OOM="-100"
  fi

  log "Regenerating systemd services (RAM: ${TOTAL_RAM_MB}MiB, repo: v$REPO_VERSION)"

  # ── whisper-stt.service ──
  cat > "$SYSTEMD_DIR/whisper-stt.service" << EOF
[Unit]
Description=Local Whisper STT Server (port 3101)
After=network.target

[Service]
Type=simple
ExecStart=$VENV_DIR/bin/python $WHISPER_DIR/server.py
WorkingDirectory=$WHISPER_DIR
Environment=WHISPER_PORT=3101
Environment=WHISPER_MODEL=tiny
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_WHISPER_MAX
MemoryHigh=$MEM_WHISPER_HIGH
OOMScoreAdjust=100

[Install]
WantedBy=default.target
EOF

  # ── whisper-realtime.service ──
  cat > "$SYSTEMD_DIR/whisper-realtime.service" << EOF
[Unit]
Description=Local OpenAI Realtime WebSocket Proxy (port 3102)
After=network.target whisper-stt.service

[Service]
Type=simple
ExecStart=$VENV_DIR/bin/python $WHISPER_DIR/realtime-proxy.py
WorkingDirectory=$WHISPER_DIR
Environment=REALTIME_PORT=3102
Environment=WHISPER_MODEL=tiny
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_WHISPER_MAX
MemoryHigh=$MEM_WHISPER_HIGH
OOMScoreAdjust=100

[Install]
WantedBy=default.target
EOF

  # ── agentos-gui.service ──
  cat > "$SYSTEMD_DIR/agentos-gui.service" << EOF
[Unit]
Description=AgentOS GUI (port 3000)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$GUI_DIR
Environment=HOME=$HOME
Environment=PATH=$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
Environment=AGENTOS_GUI_DIR=$GUI_DIR
EnvironmentFile=$HOME/.fcukproxy/.env
ExecStart=$GUI_DIR/node_modules/.bin/next start -p 3000 -H 0.0.0.0
Restart=on-failure
RestartSec=60
MemoryMax=$MEM_AGENTOS_MAX
MemoryHigh=$MEM_AGENTOS_HIGH
OOMScoreAdjust=$MEM_AGENTOS_OOM

[Install]
WantedBy=default.target
EOF

  # ── omniroute.service ──
  cat > "$SYSTEMD_DIR/omniroute.service" << EOF
[Unit]
Description=OmniRoute LLM Proxy (port 20128)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$OMNIRUTE_DIR
ExecStart=$NODE_BIN $OMNIRUTE_DIR/proxy.mjs
Environment=NODE_ENV=production
Environment=PORT=20128
Environment=OLLAMA_KEEP_ALIVE=30m
Environment=OLLAMA_TIMEOUT_MS=900000
Environment=MINICPM_NUM_CTX=2048
Environment=PROMPT_CACHE_MAX=256
Environment=PROMPT_CACHE_TTL_S=1800
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_OMNIRUTE_MAX
MemoryHigh=$MEM_OMNIRUTE_HIGH

[Install]
WantedBy=default.target
EOF

  # ── openclaw-gateway.service (only if openclaw is installed) ──
  if [[ -f "$OPENCLAW_BIN" ]]; then
    cat > "$SYSTEMD_DIR/openclaw-gateway.service" << EOF
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=$NODE_BIN $OPENCLAW_BIN gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
OOMScoreAdjust=$MEM_GATEWAY_OOM
MemoryMax=$MEM_GATEWAY_MAX
MemoryHigh=$MEM_GATEWAY_HIGH
KillMode=control-group
Environment=HOME=$HOME
Environment=TMPDIR=/tmp
Environment=PATH=$HOME/.local/node/bin:/usr/local/bin:/usr/bin:/bin
Environment=OPENCLAW_GATEWAY_PORT=18789

[Install]
WantedBy=default.target
EOF
  fi

  # ── Ensure voice-service venv exists (may be missing on pre-1.3.0 nodes) ──
  if [[ ! -d "$VENV_DIR/bin" ]]; then
    log "Creating voice-service venv..."
    python3 -m venv "$VENV_DIR" 2>/dev/null || true
    if [[ -d "$VENV_DIR/bin" ]]; then
      "$VENV_DIR/bin/pip" install --quiet faster-whisper edge-tts Flask websockets 2>>"$LOG_FILE" || true
      log "Voice venv created"
    fi
  fi

  # Enable all services
  for svc in whisper-stt whisper-realtime agentos-gui omniroute openclaw-gateway; do
    if [[ -f "$SYSTEMD_DIR/$svc.service" ]]; then
      systemctl --user enable "$svc.service" 2>/dev/null || true
    fi
  done

  systemctl --user daemon-reload 2>/dev/null || true
  log "Systemd services regenerated"
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

  # 2. Regenerate systemd services from repo (picks up memory limits, new services, etc.)
  regenerate_services

  # 3. Copy updated agentos-gui if it exists in the repo
  if [[ -d "$INSTALL_DIR/agentos/gui/src" && -d "$GUI_DIR/src" ]]; then
    log "Syncing agentos-gui..."
    rsync -a --delete \
      --exclude='.next' \
      --exclude='node_modules' \
      --exclude='package-lock.json' \
      --exclude='.git' \
      "$INSTALL_DIR/agentos/gui/" "$GUI_DIR/" 2>>"$LOG_FILE"
    log "GUI source synced"
  fi

  # 4. Copy updated omniroute
  if [[ -f "$INSTALL_DIR/agentos/omniroute/proxy.mjs" ]]; then
    mkdir -p "$HOME/.fcukproxy/omniroute"
    cp "$INSTALL_DIR/agentos/omniroute/proxy.mjs" "$HOME/.fcukproxy/omniroute/proxy.mjs"
    chmod +x "$HOME/.fcukproxy/omniroute/proxy.mjs"
    log "OmniRoute updated"
  fi

  # 5. Copy updated voice-service
  if [[ -f "$INSTALL_DIR/public/fcukproxy/voice-service/server.py" ]]; then
    mkdir -p "$HOME/.local/whisper-stt"
    cp "$INSTALL_DIR/public/fcukproxy/voice-service/server.py" "$HOME/.local/whisper-stt/server.py"
    cp "$INSTALL_DIR/public/fcukproxy/voice-service/realtime-proxy.py" "$HOME/.local/whisper-stt/realtime-proxy.py"
    chmod +x "$HOME/.local/whisper-stt/server.py" "$HOME/.local/whisper-stt/realtime-proxy.py"
    log "Voice service updated"
  fi

  # 6. GUI rebuild is handled by ensure_gui_build() at the top of main()
  #    (runs on every invocation — no need to rebuild here)

  # 7. Restart services
  log "Restarting services..."
  for svc in whisper-stt whisper-realtime omniroute agentos-gui openclaw-gateway; do
    if systemctl --user is-enabled "$svc.service" >/dev/null 2>&1; then
      systemctl --user restart "$svc.service" 2>/dev/null || true
      log "  Restarted $svc"
    fi
  done

  # 8. Write new local version
  echo "$latest" > "$LOCAL_VERSION_FILE"
  log "Update complete: now at v$latest"
}

# ── Ensure GUI has a current production build (runs on every invocation) ──────
ensure_gui_build() {
  [[ ! -d "$GUI_DIR/src" ]] && return 0
  [[ ! -f "$NPM_BIN" ]] && { log "WARN: npm not found, cannot rebuild"; return 1; }

  local NEEDS_BUILD=0

  # No production build at all — force rebuild
  if [[ ! -f "$GUI_DIR/.next/BUILD_ID" ]]; then
    log "No production build (.next/BUILD_ID missing) — forcing rebuild"
    NEEDS_BUILD=1
  elif [[ "$SKIP_REBUILD" != "1" ]]; then
    # Source changed since last build — rebuild
    local NEW_HASH OLD_HASH=""
    NEW_HASH=$(find "$GUI_DIR/src" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) 2>/dev/null | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)
    [[ -f "$GUI_DIR/.last-build-hash" ]] && OLD_HASH=$(cat "$GUI_DIR/.last-build-hash")
    if [[ "$NEW_HASH" != "$OLD_HASH" ]]; then
      log "GUI source changed — rebuilding"
      NEEDS_BUILD=1
    else
      log "GUI source unchanged — skipping rebuild"
    fi
  fi

  [[ "$NEEDS_BUILD" != "1" ]] && return 0

  cd "$GUI_DIR"
  PATH="$HOME/.local/node/bin:$PATH" "$NPM_BIN" install --ignore-scripts 2>>"$LOG_FILE" | tail -3
  [[ -f "$GUI_DIR/.next/turbopack" ]] && rm -rf "$GUI_DIR/.next"
  log "Building GUI..."
  if PATH="$HOME/.local/node/bin:$PATH" timeout 600 "$HOME/.local/node/bin/npx" next build 2>>"$LOG_FILE" | tail -5; then
    find "$GUI_DIR/src" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) 2>/dev/null | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1 > "$GUI_DIR/.last-build-hash"
    log "GUI built successfully"
  else
    log "ERROR: GUI build failed — port 3000 may not start"
    return 1
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  log "Checking for updates..."

  # Always ensure GUI is buildable (even when version is current)
  ensure_gui_build

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
