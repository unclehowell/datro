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
REPO="unclehowell/datro"
BRANCH="financecheque"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.fcukproxy/datro}"
GUI_DIR="${GUI_DIR:-$HOME/.fcukproxy/agentos-gui}"
LOCAL_VERSION_FILE="$HOME/.fcukproxy/.local-version"
STATUS_FILE="$HOME/.fcukproxy/.update-status"
LOG_FILE="$HOME/.fcukproxy/logs/ota-update.log"
# Termux/Android: /tmp is a root-owned tmpfs, not writable by the app.
# Use a writable temp dir for tarball extraction and other temp files.
if [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then
  TMPDIR="${TMPDIR:-$HOME/.tmp}"
else
  TMPDIR="${TMPDIR:-/tmp}"
fi
SKIP_REBUILD="${SKIP_REBUILD:-0}"
DRY_RUN="${DRY_RUN:-0}"

# ── Detect node/npm paths (handles Termux $PREFIX/bin vs bundled ~/.local/node) ──
NODE_BIN=""
NPM_BIN=""
NPX_BIN=""
for candidate_node in "$HOME/.local/node/bin/node" "$(command -v node 2>/dev/null)" "${PREFIX:-}/bin/node"; do
  if [[ -n "$candidate_node" && -x "$candidate_node" ]]; then NODE_BIN="$candidate_node"; break; fi
done
for candidate_npm in "$HOME/.local/node/bin/npm" "$(command -v npm 2>/dev/null)" "${PREFIX:-}/bin/npm"; do
  if [[ -n "$candidate_npm" && -x "$candidate_npm" ]]; then NPM_BIN="$candidate_npm"; break; fi
done
for candidate_npx in "$HOME/.local/node/bin/npx" "$(command -v npx 2>/dev/null)" "${PREFIX:-}/bin/npx"; do
  if [[ -n "$candidate_npx" && -x "$candidate_npx" ]]; then NPX_BIN="$candidate_npx"; break; fi
done

mkdir -p "$TMPDIR" 2>/dev/null || true
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$msg" >&2 | tee -a "$LOG_FILE"
}

# ── Reconcile the GUI's update status file on every completion ───────────────
# The WebGUI banner on port 3000 reads  ~/.fcukproxy/.update-status. Only the
# /api/update POST wrote it, so when an update completed through the systemd
# timer path the old file was left stale (e.g. a failed attempt from hours ago
# kept showing "Update failed — will retry" even after the node caught up).
# update-checker.sh now owns this file and reconciles it at every terminal exit,
# so the status reflects reality no matter which path launched us.
mkdir -p "$(dirname "$STATUS_FILE")"

write_update_status() {
  local state="$1"
  local from="${2:-$(get_local_version)}"
  local to="${3:-$from}"
  mkdir -p "$(dirname "$STATUS_FILE")"
  cat > "$STATUS_FILE" <<EOF
{
  "state": "$state",
  "from": "$from",
  "to": "$to",
  "started": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "finished": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
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
  local _NODE_BIN="$HOME/.local/node/bin/node"
  local OPENCLAW_BIN="$HOME/.local/lib/node_modules/openclaw/dist/index.js"
  # Fall back to detected node if bundled path doesn't exist
  [[ ! -x "$_NODE_BIN" && -n "$NODE_BIN" ]] && _NODE_BIN="$NODE_BIN"

  # Read version from repo
  local REPO_VERSION
  REPO_VERSION=$(cat "$INSTALL_DIR/.version" 2>/dev/null | tr -d '[:space:]') || REPO_VERSION="1.0.0"

  # ── Detect RAM and compute adaptive memory limits ──
  local TOTAL_RAM_MB
  TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo 4096)

  local MEM_WHISPER_MAX MEM_WHISPER_HIGH MEM_AGENTOS_MAX MEM_AGENTOS_HIGH MEM_AGENTOS_OOM
  local MEM_OMNIRUTE_MAX MEM_OMNIRUTE_HIGH MEM_GATEWAY_MAX MEM_GATEWAY_HIGH MEM_GATEWAY_OOM
  local MEM_GRAPHRAG_MAX MEM_GRAPHRAG_HIGH

  if [[ "$TOTAL_RAM_MB" -le 4096 ]]; then
    MEM_WHISPER_MAX="192M";    MEM_WHISPER_HIGH="128M"
    MEM_AGENTOS_MAX="96M";     MEM_AGENTOS_HIGH="64M";     MEM_AGENTOS_OOM="500"
    MEM_OMNIRUTE_MAX="256M";   MEM_OMNIRUTE_HIGH="192M"
    MEM_GATEWAY_MAX="384M";    MEM_GATEWAY_HIGH="256M";    MEM_GATEWAY_OOM="-100"
    MEM_GRAPHRAG_MAX="96M";    MEM_GRAPHRAG_HIGH="64M"
  else
    MEM_WHISPER_MAX="256M";    MEM_WHISPER_HIGH="192M"
    MEM_AGENTOS_MAX="128M";    MEM_AGENTOS_HIGH="96M";     MEM_AGENTOS_OOM="500"
    MEM_OMNIRUTE_MAX="512M";   MEM_OMNIRUTE_HIGH="384M"
    MEM_GATEWAY_MAX="512M";    MEM_GATEWAY_HIGH="384M";    MEM_GATEWAY_OOM="-100"
    MEM_GRAPHRAG_MAX="128M";   MEM_GRAPHRAG_HIGH="96M"
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
ExecStart=$_NODE_BIN $OMNIRUTE_DIR/proxy.mjs
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

  # ── task-router.service (part of the Main Agent on-demand stack) ──
  cat > "$SYSTEMD_DIR/task-router.service" << EOF
[Unit]
Description=AgentOS Task Router (port 3200)
After=network-online.target omniroute.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$OMNIRUTE_DIR
ExecStart=$_NODE_BIN $OMNIRUTE_DIR/task-router.mjs
Environment=NODE_ENV=production
Environment=PORT=3200
Environment=OMNIRUTE_URL=http://localhost:20128
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_OMNIRUTE_MAX
MemoryHigh=$MEM_OMNIRUTE_HIGH

[Install]
WantedBy=default.target
EOF

  # ── hermes-local.service — Support Agent (ollama-cloud, port 18789) ──
  cat > "$SYSTEMD_DIR/hermes-local.service" << EOF
[Unit]
Description=Hermes Support Agent (ollama-cloud, port 18789)
After=network-online.target whisper-stt.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=$HOME/.fcukproxy/hermes/hermes-support.sh start
ExecStop=$HOME/.fcukproxy/hermes/hermes-support.sh stop
Environment=HOME=$HOME
Environment=PATH=$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
MemoryMax=$MEM_GATEWAY_MAX
MemoryHigh=$MEM_GATEWAY_HIGH

[Install]
WantedBy=default.target
EOF

  # ── hermes-proxy.service — Main Agent (local MiniCPM stack) ──
  cat > "$SYSTEMD_DIR/hermes-proxy.service" << EOF
[Unit]
Description=Hermes Main Agent (local MiniCPM via Ollama + OmniRoute)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=$HOME/.fcukproxy/hermes/hermes-main.sh start
ExecStop=$HOME/.fcukproxy/hermes/hermes-main.sh stop
Environment=HOME=$HOME
Environment=PATH=$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
TimeoutStartSec=300
TimeoutStopSec=30

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
ExecStart=$_NODE_BIN $OPENCLAW_BIN gateway --port 18789
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

  # ── graphrag.service ──
  local GRAPHRAG_DIR="$HOME/.fcukproxy/graphrag"
  if [[ -f "$GRAPHRAG_DIR/graphrag_server.py" ]]; then
    cat > "$SYSTEMD_DIR/graphrag.service" << EOF
[Unit]
Description=GraphRAG Knowledge Server (port 8050)
After=network.target

[Service]
Type=simple
WorkingDirectory=$GRAPHRAG_DIR
ExecStart=/usr/bin/python3 $GRAPHRAG_DIR/graphrag_server.py
Restart=on-failure
RestartSec=10
MemoryMax=$MEM_GRAPHRAG_MAX
MemoryHigh=$MEM_GRAPHRAG_HIGH

[Install]
WantedBy=default.target
EOF
  fi

  # ── fcukproxy-child.service (child-proxy.mjs — HTTP gateway on port 4001) ──
  local CHILD_PROXY="$INSTALL_DIR/child-proxy.mjs"
  [[ ! -f "$CHILD_PROXY" ]] && CHILD_PROXY="$HOME/.fcukproxy/child-proxy.mjs"
  if [[ -f "$CHILD_PROXY" ]]; then
    cat > "$SYSTEMD_DIR/fcukproxy-child.service" << EOF
[Unit]
Description=FinanceCheque Child Proxy HTTP Gateway (port 4001)
After=network-online.target fcuk-proxy.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=$_NODE_BIN $CHILD_PROXY
WorkingDirectory=$HOME/.fcukproxy
Environment=HOME=$HOME
Environment=PATH=$(dirname "$_NODE_BIN"):/usr/local/bin:/usr/bin:/bin
Environment=PORT=4001
Restart=on-failure
RestartSec=10

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

  # ── Copy Hermes profile scripts (Main Agent + Support Agent engines) ──
  if [[ -d "$INSTALL_DIR/public/fcukproxy/hermes" ]]; then
    mkdir -p "$HOME/.fcukproxy/hermes"
    cp -f "$INSTALL_DIR/public/fcukproxy/hermes/"*.sh "$HOME/.fcukproxy/hermes/" 2>/dev/null || true
    cp -f "$INSTALL_DIR/public/fcukproxy/hermes/"*.mjs "$HOME/.fcukproxy/hermes/" 2>/dev/null || true
    chmod +x "$HOME/.fcukproxy/hermes/"*.sh 2>/dev/null || true
  fi

  # ── Copy task-router.mjs alongside omniroute ──
  if [[ -f "$INSTALL_DIR/agentos/task-router.mjs" ]]; then
    mkdir -p "$OMNIRUTE_DIR"
    cp -f "$INSTALL_DIR/agentos/task-router.mjs" "$OMNIRUTE_DIR/task-router.mjs"
    chmod +x "$OMNIRUTE_DIR/task-router.mjs" 2>/dev/null || true
  fi

  # Model engines must NOT run by default (thin-client policy): only the GUI
  # webserver is enabled at boot. Whisper STT, OmniRoute, Task Router, the
  # Hermes profiles and Ollama all start ON DEMAND and idle-shut-down.
  if [[ -f "$SYSTEMD_DIR/agentos-gui.service" ]]; then
    systemctl --user enable agentos-gui.service 2>/dev/null || true
  fi
  for svc in whisper-stt whisper-realtime omniroute task-router hermes-local hermes-proxy openclaw-gateway graphrag fcukproxy-child; do
    systemctl --user disable "$svc.service" 2>/dev/null || true
  done

  # ── Self-heal the update cadence to every 10 minutes ─────────────────────
  ensure_update_cadence

  systemctl --user daemon-reload 2>/dev/null || true
  log "Systemd services regenerated (only agentos-gui enabled by default)"
}

# ── Ensure the OTA self-update cadence is every 10 minutes ──────────────────
# The installed timer may predate the 10-minute policy (e.g. daily 04:00).
# Rewriting it here lets a node that runs this checker at ANY cadence upgrade
# itself to the faster schedule, so a newer semantic version is pulled within
# minutes, not up to 24h later. Re-enable so it survives even if it had drifted
# to disabled. Called on every invocation so a node self-corrects even when it
# is already up to date.
ensure_update_cadence() {
  if command -v systemctl >/dev/null 2>&1; then
    local SYSTEMD_DIR="$HOME/.config/systemd/user"
    mkdir -p "$SYSTEMD_DIR"
    cat > "$SYSTEMD_DIR/fcuk-update-checker.timer" << TIMEREOF
[Unit]
Description=FinanceCheque OTA update check (every 10 minutes)

[Timer]
OnCalendar=*:0/10
Persistent=true

[Install]
WantedBy=timers.target
TIMEREOF
    systemctl --user enable --now fcuk-update-checker.timer >/dev/null 2>&1 || true
    log "Update cadence set to every 10 minutes"
  fi
}

# ── Ensure Termux crontab has the correct environment ─────────────────────────
# On Termux, cron runs with a minimal PATH and TMPDIR=/tmp (which is not
# writable). Without these, the update-checker silently fails. This function
# rewrites the crontab entry to include the required env vars, so future cron
# runs work correctly. Called on every invocation so a node self-corrects.
ensure_termux_crontab() {
  if [[ -z "${TERMUX_VERSION:-}" && ! -d "/data/data/com.termux" ]]; then
    return 0  # not Termux
  fi
  if ! command -v crontab >/dev/null 2>&1; then
    return 0
  fi
  # Ensure Termux crontab cache directory exists (crontab command needs it)
  mkdir -p "$HOME/.cache/crontab" 2>/dev/null || true
  mkdir -p "/data/user/0/com.termux/.cache/crontab" 2>/dev/null || true
  local cron_cmd="*/10 * * * * export TMPDIR=\$HOME/.tmp; export PATH=/data/data/com.termux/files/usr/bin:\$PATH; bash \$HOME/.fcukproxy/update-checker.sh >> \$HOME/.fcukproxy/logs/ota-update.log 2>&1"
  local current
  current=$(crontab -l 2>/dev/null || true)
  # Only rewrite if the entry is missing or lacks TMPDIR
  if echo "$current" | grep -q "update-checker.sh" && echo "$current" | grep -q "TMPDIR"; then
    return 0  # already correct
  fi
  # Remove old entry and add corrected one
  ( echo "$current" | grep -v "update-checker.sh"; echo "$cron_cmd" ) | crontab - 2>/dev/null || true
  log "Termux crontab updated with TMPDIR and PATH"
}

# ── Apply update ──────────────────────────────────────────────────────────────
apply_update() {
  local latest="$1"

  log "Updating from $(get_local_version) → $latest"

  # 1. Update code — git pull if repo exists, tarball download otherwise
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    log "Pulling latest code (git)..."
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH" 2>>"$LOG_FILE"
    git reset --hard "origin/$BRANCH" 2>>"$LOG_FILE"
    log "Code updated (git)"
    # Self-update: copy runtime scripts from the freshly pulled repo
    mkdir -p "$HOME/.fcukproxy"
    for runtime_script in update-checker.sh wake.sh tool-use-wrapper.sh reflect.sh; do
      if [[ -f "$INSTALL_DIR/public/fcukproxy/$runtime_script" ]]; then
        cp -f "$INSTALL_DIR/public/fcukproxy/$runtime_script" "$HOME/.fcukproxy/$runtime_script"
        chmod +x "$HOME/.fcukproxy/$runtime_script"
        log "Runtime script updated: $runtime_script"
      fi
    done
  else
    log "Downloading release tarball (no git repo)..."
    local tarball_url="https://github.com/$REPO/archive/refs/tags/financecheque-v${latest}.tar.gz"
    local tmp_extract="$TMPDIR/fcuk-update-$$"
    mkdir -p "$tmp_extract"
    if curl -fsSL --max-time 120 "$tarball_url" -o "$tmp_extract/release.tgz" 2>>"$LOG_FILE"; then
      tar xzf "$tmp_extract/release.tgz" -C "$tmp_extract" 2>>"$LOG_FILE"
      # Dynamic directory detection: GitHub tarballs extract to a directory
      # named after the repo and tag. The pattern is usually
      # "repo-tag" or "repo-tag-sha", so we glob for the actual dir rather
      # than hardcoding the expected name (which failed on v1.8.0).
      local extracted
      extracted=$(find "$tmp_extract" -maxdepth 1 -type d -name "datro*" | head -1)
      if [[ -n "$extracted" && -d "$extracted" ]]; then
        log "Extracted to: $extracted"
        # Sync fcukproxy scripts
        mkdir -p "$INSTALL_DIR"
        rsync -a --delete "$extracted/public/fcukproxy/" "$INSTALL_DIR/" 2>>"$LOG_FILE"
        # Self-update: copy the runtime scripts that systemd/cron execute
        # from ~/.fcukproxy/ (not just the repo copy in ~/.fcukproxy/datro/).
        # Without this, the running update-checker.sh would stay at the old
        # version forever and bugs fixed in newer releases (e.g. status
        # reconciliation, tarball extraction) would never take effect on the
        # node — the systemd timer would keep running stale code.
        mkdir -p "$HOME/.fcukproxy"
        for runtime_script in update-checker.sh wake.sh tool-use-wrapper.sh reflect.sh; do
          if [[ -f "$extracted/public/fcukproxy/$runtime_script" ]]; then
            cp -f "$extracted/public/fcukproxy/$runtime_script" "$HOME/.fcukproxy/$runtime_script"
            chmod +x "$HOME/.fcukproxy/$runtime_script"
            log "Runtime script updated: $runtime_script"
          fi
        done
        # Sync GUI source
        if [[ -d "$extracted/agentos/gui/src" ]]; then
          mkdir -p "$(dirname "$GUI_DIR")"
          rsync -a --delete \
            --exclude='.next' --exclude='node_modules' --exclude='package-lock.json' \
            "$extracted/agentos/gui/" "$GUI_DIR/" 2>>"$LOG_FILE"
          log "GUI source synced (tarball)"
        fi
        # Sync version file
        [[ -f "$extracted/.version" ]] && cp "$extracted/.version" "$INSTALL_DIR/.version"
        log "Code updated (tarball)"
      else
        log "ERROR: Extracted directory not found in $tmp_extract"
        log "Contents: $(ls -la "$tmp_extract" 2>/dev/null | head -10)"
      fi
    else
      log "ERROR: Failed to download release tarball"
    fi
    rm -rf "$tmp_extract"
  fi

  # 2. Regenerate systemd services from repo (picks up memory limits, new services, etc.)
  regenerate_services

  # 3. Re-sync deployed source AFTER the pull/apply. sync_source() at the top of
  #    main() ran against the OLD $INSTALL_DIR (the pull had not happened yet), so
  #    the GUI dir would otherwise hold the previous release's code while the
  #    repo is already on the new one — the stale-GUI-build bug where a node
  #    serves an old /api/version bundle after updating.
  sync_source

  # 4. Rebuild the GUI from the NEWLY synced source. ensure_gui_build() at the
  #    top of main() also ran pre-pull; rebuilding here guarantees the process
  #    restarted below serves a bundle whose source matches the pulled commit.
  ensure_gui_build || log "WARN: GUI rebuild after update did not complete (non-fatal)"

  # 5. Copy updated voice-service
  if [[ -f "$INSTALL_DIR/public/fcukproxy/voice-service/server.py" ]]; then
    mkdir -p "$HOME/.local/whisper-stt"
    cp "$INSTALL_DIR/public/fcukproxy/voice-service/server.py" "$HOME/.local/whisper-stt/server.py"
    cp "$INSTALL_DIR/public/fcukproxy/voice-service/realtime-proxy.py" "$HOME/.local/whisper-stt/realtime-proxy.py"
    chmod +x "$HOME/.local/whisper-stt/server.py" "$HOME/.local/whisper-stt/realtime-proxy.py"
    log "Voice service updated"
  fi

  # 7. Restart services (only after rebuild, so the GUI never serves a stale bundle)
  log "Restarting services..."
  for svc in whisper-stt whisper-realtime omniroute agentos-gui openclaw-gateway fcukproxy-child; do
    if systemctl --user is-enabled "$svc.service" >/dev/null 2>&1; then
      systemctl --user restart "$svc.service" 2>/dev/null || true
      log "  Restarted $svc"
    fi
  done

  # 7b. Termux: kill any old next-server and start a fresh one with the rebuilt .next.
  # Without this, the phone keeps serving the old GUI bundle that the v1.11.15 chat
  # fix never reaches (the running next-server is the v1.11.0-era build).
  if [[ -d "/data/data/com.termux" || -n "${TERMUX_VERSION:-}" ]]; then
    log "Termux detected — restarting next-server to serve rebuilt GUI"
    # Kill existing next-server processes (match `next-server` and any node that ran `next start`)
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "node node_modules/.bin/next" 2>/dev/null || true
    sleep 2
    if [[ -d "$GUI_DIR" && -f "$GUI_DIR/.next/BUILD_ID" ]]; then
      mkdir -p "$GUI_DIR"
      ( cd "$GUI_DIR"
        export PATH="$GUI_DIR/node_modules/.bin:$PATH"
        setsid nohup node node_modules/.bin/next start -p 3000 -H 0.0.0.0 \
          > "$GUI_DIR/gui.log" 2>&1 < /dev/null &
        echo "GUI_PID=$!"
      ) >> "$LOG_FILE" 2>&1
      log "Termux GUI restarted (PID: $!)"
    else
      log "WARN: Cannot restart Termux GUI — no build at $GUI_DIR/.next/BUILD_ID"
    fi
  fi

  # 8. Write new local version
  echo "$latest" > "$LOCAL_VERSION_FILE"
  log "Update complete: now at v$latest"
}

# ── Sync source from repo to deployed dirs (runs on every invocation) ─────────
sync_source() {
  if [[ -d "$INSTALL_DIR/agentos/gui/src" && -d "$GUI_DIR/src" ]]; then
    rsync -a --delete \
      --exclude='.next' \
      --exclude='node_modules' \
      --exclude='package-lock.json' \
      --exclude='.git' \
      "$INSTALL_DIR/agentos/gui/" "$GUI_DIR/" 2>>"$LOG_FILE"
    log "GUI source synced"
  fi

  if [[ -f "$INSTALL_DIR/agentos/omniroute/proxy.mjs" ]]; then
    mkdir -p "$HOME/.fcukproxy/omniroute"
    cp "$INSTALL_DIR/agentos/omniroute/proxy.mjs" "$HOME/.fcukproxy/omniroute/proxy.mjs"
    chmod +x "$HOME/.fcukproxy/omniroute/proxy.mjs"
    log "OmniRoute synced"
  fi

  # Sync graphrag knowledge base
  if [[ -d "$INSTALL_DIR/agentos/graphrag" ]]; then
    mkdir -p "$HOME/.fcukproxy/graphrag/input"
    rsync -a --delete \
      --exclude='.venv' \
      --exclude='logs' \
      --exclude='phone_pdfs' \
      --exclude='prompts' \
      --exclude='settings.yaml' \
      --exclude='.env' \
      "$INSTALL_DIR/agentos/graphrag/" "$HOME/.fcukproxy/graphrag/" 2>>"$LOG_FILE"
    log "GraphRAG synced"
  fi
}

# ── Ensure GUI has a current production build (runs on every invocation) ──────
ensure_gui_build() {
  [[ ! -d "$GUI_DIR/src" ]] && return 0
  if [[ -z "$NPM_BIN" ]]; then
    log "WARN: npm not found — skipping GUI build"
    return 1
  fi

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
  # Ensure node_modules/.bin is in PATH so npm/next resolve correctly on Termux
  local BUILD_PATH="$GUI_DIR/node_modules/.bin:$(dirname "$NODE_BIN"):$PATH"
  PATH="$BUILD_PATH" "$NPM_BIN" install --ignore-scripts 2>>"$LOG_FILE" | tail -3

  # Clean stale turbopack marker that forces unnecessary full rebuilds
  [[ -f "$GUI_DIR/.next/turbopack" ]] && rm -rf "$GUI_DIR/.next"

  local build_args=()
  if [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then
    build_args=(--webpack)
  fi
  log "Building GUI (args: ${build_args[*]:-default})..."
  # Use NODE_OPTIONS to cap heap so we don't OOM on low-RAM machines
  local NODE_HEAP="512"
  local TOTAL_RAM_MB
  TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo 4096)
  [[ "$TOTAL_RAM_MB" -le 2048 ]] && NODE_HEAP="384"
  # On Termux, /usr/bin/env doesn't exist so we must invoke via node directly.
  # Also ensure the system node (e.g. /data/data/com.termux/files/usr/bin/node)
  # is on PATH for the build subprocess.
  local NODE_BIN_RESOLVED="${NODE_BIN:-}"
  [[ -z "$NODE_BIN_RESOLVED" || ! -x "$NODE_BIN_RESOLVED" ]] && NODE_BIN_RESOLVED="$(command -v node || true)"
  if [[ -n "$NODE_BIN_RESOLVED" && -x "$NODE_BIN_RESOLVED" ]]; then
    export PATH="$(dirname "$NODE_BIN_RESOLVED"):$BUILD_PATH"
  fi
  local NEXT_CMD=()
  if [[ -x "$GUI_DIR/node_modules/.bin/next" ]]; then
    local shebang
    shebang=$(head -1 "$GUI_DIR/node_modules/.bin/next" 2>/dev/null || true)
    if [[ "$shebang" == *"/usr/bin/env"* ]] && [[ ! -x "/usr/bin/env" ]]; then
      NEXT_CMD=("$NODE_BIN_RESOLVED" "$GUI_DIR/node_modules/.bin/next")
    else
      NEXT_CMD=("$GUI_DIR/node_modules/.bin/next")
    fi
  else
    NEXT_CMD=("$NODE_BIN_RESOLVED" "$GUI_DIR/node_modules/.bin/next")
  fi
  if NODE_OPTIONS="--max-old-space-size=$NODE_HEAP" PATH="$PATH" \
     timeout 600 "${NEXT_CMD[@]}" build "${build_args[@]}" 2>>"$LOG_FILE" | tail -5; then
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

  # Sync source from repo to deployed dirs (picks up API changes etc.)
  sync_source

  # Always ensure GUI is buildable (even when version is current)
  # Non-fatal: build failures should not block service regeneration or version checks
  ensure_gui_build || log "WARN: GUI build did not complete (non-fatal)"

  # Ensure the self-update cadence is every 10 minutes (self-heals stale timers
  # even when there is no update to apply).
  ensure_update_cadence

  # Ensure Termux crontab has TMPDIR and PATH (self-heals broken cron entries
  # that would silently fail on Android's read-only /tmp).
  ensure_termux_crontab

  local latest
  if ! latest=$(fetch_latest_version); then
    write_update_status error "$(get_local_version)" "unknown"
    exit 1
  fi

  if [[ -z "$latest" ]]; then
    log "ERROR: Empty version from parent"
    write_update_status error "$(get_local_version)" "unknown"
    exit 1
  fi

  local local_version
  local_version=$(get_local_version)

  log "Local: v$local_version | Remote: v$latest"

  if [[ "$local_version" == "$latest" ]]; then
    log "Already up to date"
    write_update_status idle "$local_version" "$latest"
    exit 0
  fi

  if ! version_lt "$local_version" "$latest"; then
    log "Local version ($local_version) >= remote ($latest) — skipping"
    write_update_status idle "$local_version" "$latest"
    exit 0
  fi

  log "Update available: v$local_version → v$latest"

  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY RUN — not applying"
    write_update_status idle "$local_version" "$latest"
    exit 0
  fi

  apply_update "$latest"
  # Successful apply — clear any prior error status so the GUI shows the new
  # version, not a stale failure.
  write_update_status done "$local_version" "$latest"
}

main "$@"
