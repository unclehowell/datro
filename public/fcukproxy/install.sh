#!/usr/bin/env bash
# FCUK Proxy — Universal Child Proxy Installer
# Supports: Linux (apt/yum/apk/dnf/brew), Termux/Android, and similar environments
# Usage: curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash

set -euo pipefail

# ── Version ───────────────────────────────────────────────────────────────
FCUK_VERSION="0.5.0"

# ── Configuration ──────────────────────────────────────────────────────────
MACHINE_DIR="${HOME}/.fcukproxy"
MACHINE_JSON="${MACHINE_DIR}/machine.json"
PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
PROXY_PORT="${PROXY_PORT:-4001}"

# ── OS Detection ───────────────────────────────────────────────────────────
IS_TERMUX=false
PKG_MGR=""

detect_os() {
  if [[ -n "${TERMUX_VERSION:-}" || "$(uname -o 2>/dev/null)" == "Android" || -d "/data/data/com.termux" ]]; then
    IS_TERMUX=true
    PKG_MGR="pkg"
  elif command -v apt >/dev/null 2>&1; then
    PKG_MGR="apt"
  elif command -v yum >/dev/null 2>&1; then
    PKG_MGR="yum"
  elif command -v apk >/dev/null 2>&1; then
    PKG_MGR="apk"
  elif command -v dnf >/dev/null 2>&1; then
    PKG_MGR="dnf"
  elif command -v brew >/dev/null 2>&1; then
    PKG_MGR="brew"
  fi
}

detect_os

# ── Portable Machine ID Generator ───────────────────────────────────────────
get_machine_id() {
  local input="$1"
  if command -v md5sum >/dev/null 2>&1; then
    echo "$input" | md5sum | cut -c1-32
  elif command -v md5 >/dev/null 2>&1; then
    echo "$input" | md5 | cut -c1-32
  elif command -v openssl >/dev/null 2>&1; then
    echo "$input" | openssl dgst -md5 | awk '{print $2}' | cut -c1-32
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import hashlib; print(hashlib.md5('$input'.encode()).hexdigest()[:32])"
  else
    echo "child-$(hostname)-$(date +%s)" | cut -c1-32
  fi
}

# ── Get Local IP ───────────────────────────────────────────────────────────
get_local_ip() {
  local ip=""
  ip=$(ip route get 1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')
  [[ -z "$ip" ]] && ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  [[ -z "$ip" ]] && ip=$(ifconfig 2>/dev/null | awk '/inet /{print $2; exit}')
  echo "${ip:-127.0.0.1}"
}

echo "═══ FCUK Proxy Installer v${FCUK_VERSION} ═══"
echo "OS: $(uname -a)"
[[ "$IS_TERMUX" == "true" ]] && echo "Mode: Termux/Android"
echo ""

# ── Install Dependencies ──────────────────────────────────────────────────────
install_deps() {
  if command -v node >/dev/null 2>&1; then
    echo "[✓] Node.js $(node -v) found"
    return 0
  fi
  echo "[*] Installing Node.js..."
  case "${PKG_MGR}" in
    pkg)
      pkg update -y 2>/dev/null || true
      pkg install -y nodejs 2>/dev/null && pkg install -y npm 2>/dev/null || true
      ;;
    apt)
      sudo apt-get update -qq && sudo apt-get install -y nodejs npm
      ;;
    yum)
      sudo yum install -y nodejs
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null || true
      ;;
    apk)
      apk add nodejs npm
      ;;
    dnf)
      sudo dnf install -y nodejs npm
      ;;
    brew)
      brew install node
      ;;
    *)
      echo "[!] No supported package manager. Install Node.js manually: https://nodejs.org"
      return 1
      ;;
  esac
}

install_deps || echo "[!] Node.js installation may have failed - continuing anyway"

# ── Termux Setup ───────────────────────────────────────────────────────────
setup_termux_persistence() {
  if [[ ! "$IS_TERMUX" == "true" ]]; then
    return 0
  fi
  echo "[*] Setting up Termux background persistence..."
  termux-wake-lock 2>/dev/null || echo "[!] termux-wake-lock not available (install termux-api)"
  mkdir -p "${HOME}/.termux/boot"
  
  # Create boot script for auto-start on Android reboot
  cat > "${HOME}/.termux/boot/fcukproxy-boot" << 'BOOTEOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null
sleep 10
cd "$HOME/.fcukproxy"
if [[ -f "child-proxy.mjs" ]]; then
  nohup node child-proxy.mjs > proxy.log 2>&1 &
fi
BOOTEOF
  chmod +x "${HOME}/.termux/boot/fcukproxy-boot" 2>/dev/null || true
  echo "[✓] Termux boot script created (requires termux-services)"
}

[[ "$IS_TERMUX" == "true" ]] && setup_termux_persistence

# ── Create Machine Identity (idempotent) ───────────────────────────────────
mkdir -p "${MACHINE_DIR}"

if [[ -f "${MACHINE_JSON}" ]]; then
  MACHINE_ID=$(python3 -c "import json; print(json.load(open('${MACHINE_JSON}')).get('machine_id', ''))" 2>/dev/null || echo "")
  if [[ -z "$MACHINE_ID" ]]; then
    MACHINE_ID=$(get_machine_id "machine-$(date +%s)")
    echo "[*] Regenerated missing machine_id"
  fi
  AGENT_ROLE=$(python3 -c "import json; print(json.load(open('${MACHINE_JSON}')).get('role', 'chat'))" 2>/dev/null || echo "chat")
  echo "[*] Using existing machine identity: ${MACHINE_ID}"
else
  MACHINE_ID=$(get_machine_id "machine-$(date +%s)")
  MACHINE_NAME=$(hostname 2>/dev/null || echo 'unknown')
  AGENT_ROLE="${AGENT_ROLE:-chat}"
  cat > "${MACHINE_JSON}" << MACHINEEOF
{
  "machine_id": "${MACHINE_ID}",
  "machine_name": "${MACHINE_NAME}",
  "local_ip": "$(get_local_ip)",
  "proxy_port": ${PROXY_PORT},
  "parent": "${PARENT_URL}/api/proxy",
  "version": "${FCUK_VERSION}",
  "role": "${AGENT_ROLE}",
  "installed_at": "$(date -Iseconds 2>/dev/null || date)"
}
MACHINEEOF
  echo "[✓] Created machine identity: ${MACHINE_ID}"
fi

# ── Download child-proxy.mjs (with GitHub fallback) ───────────────────────────
echo "[*] Downloading child proxy..."
download_child_proxy() {
  local urls=(
    "${PARENT_URL}/fcukproxy/child-proxy.mjs"
    "https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy/child-proxy.mjs"
  )
  for u in "${urls[@]}"; do
    if curl -fsSL "$u" -o "${MACHINE_DIR}/child-proxy.mjs" 2>/dev/null; then
      echo "[✓] Downloaded from: $u"
      return 0
    fi
  done
  echo "[!] Failed to download child-proxy.mjs from all sources"
  return 1
}

download_child_proxy || exit 1
chmod +x "${MACHINE_DIR}/child-proxy.mjs"

# ── Create Hermes Config Directory ───────────────────────────────────────────
mkdir -p "${MACHINE_DIR}/hermes"

# ── Write Service Runner Script ──────────────────────────────────────────────
cat > "${MACHINE_DIR}/run-proxy.sh" << RUNNEREOF
#!/usr/bin/env bash
export PORT=${PROXY_PORT}
export CHILD_ID="${MACHINE_ID}"
export MACHINE_NAME="\$(hostname)"
export AGENT_ROLE="${AGENT_ROLE}"
export PARENT_URL="${PARENT_URL}"
[[ -n "\${NGROK_URL:-}" ]] && export NGROK_URL="\${NGROK_URL:-}"
cd "${MACHINE_DIR}"
exec node "${MACHINE_DIR}/child-proxy.mjs"
RUNNEREOF
chmod +x "${MACHINE_DIR}/run-proxy.sh"

# ── Install Service (systemd / Termux / tmux) ───────────────────────────────
install_service() {
  echo "[*] Installing background service..."
  
  if command -v systemctl >/dev/null 2>&1 && [[ "$IS_TERMUX" == "false" ]]; then
    # systemd user service
    mkdir -p "${HOME}/.config/systemd/user"
    cat > "${HOME}/.config/systemd/user/fcukproxy.service" << SVCEOF
[Unit]
Description=FCUK Proxy Child Service
After=network.target

[Service]
Type=simple
ExecStart=${MACHINE_DIR}/run-proxy.sh
Restart=always
RestartSec=5
Environment=PORT=${PROXY_PORT}
Environment=CHILD_ID=${MACHINE_ID}
Environment=AGENT_ROLE=${AGENT_ROLE}
Environment=PARENT_URL=${PARENT_URL}

[Install]
WantedBy=default.target
SVCEOF
    cat > "${HOME}/.config/systemd/user/fcukproxy-heartbeat.service" << HBSVCEOF
[Unit]
Description=FCUK Proxy Heartbeat

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -s -m 5 -X POST ${PARENT_URL}/api/proxy?action=heartbeat -H 'Content-Type: application/json' -d '{"machine_id":"${MACHINE_ID}","machine_name":"$(hostname)"}'

[Install]
WantedBy=timers.target
HBSVCEOF
    cat > "${HOME}/.config/systemd/user/fcukproxy-heartbeat.timer" << HBTIMEREOF
[Unit]
Description=FCUK Proxy Heartbeat Timer

[Timer]
OnBootSec=30sec
OnUnitActiveSec=60sec

[Install]
WantedBy=timers.target
HBTIMEREOF
    systemctl --user daemon-reload 2>/dev/null || true
    systemctl --user enable fcukproxy.service 2>/dev/null || true
    systemctl --user enable fcukproxy-heartbeat.timer 2>/dev/null || true
    systemctl --user restart fcukproxy.service 2>/dev/null || true
    echo "[✓] systemd service installed and started"
    return 0
  fi
  
  if [[ "$IS_TERMUX" == "true" ]]; then
    # Termux: use background loop (more reliable than tmux on Termux)
    if command -v termux-wake-lock >/dev/null 2>&1; then
      termux-wake-lock 2>/dev/null || true
      echo "[✓] Wake lock acquired"
    fi
    
    pkill -f "child-proxy.mjs" 2>/dev/null || true
    nohup bash -c "while true; do node ${MACHINE_DIR}/child-proxy.mjs >> ${MACHINE_DIR}/proxy.log 2>&1; sleep 5; done" &
    echo "[✓] Background loop started (PID: $!)"
    return 0
  fi
  
  # Fallback: tmux
  if command -v tmux >/dev/null 2>&1; then
    tmux kill-session -t fcukproxy 2>/dev/null || true
    tmux new-session -d -s fcukproxy "bash ${MACHINE_DIR}/run-proxy.sh"
    echo "[✓] tmux session started: fcukproxy"
    return 0
  fi
  
  # Last resort: nohup
  pkill -f "child-proxy.mjs" 2>/dev/null || true
  nohup bash "${MACHINE_DIR}/run-proxy.sh" > "${MACHINE_DIR}/proxy.log" 2>&1 &
  echo "[✓] nohup background started (PID: $!)"
}

install_service

# ── Write Hermes Config ──────────────────────────────────────────────────────
cat > "${MACHINE_DIR}/hermes/hermes.json" << HERMESEOF
{
  "name": "fcukproxy-hermes",
  "version": "${FCUK_VERSION}",
  "parent_url": "${PARENT_URL}/api/proxy",
  "machine_id": "${MACHINE_ID}",
  "role": "${AGENT_ROLE}",
  "routing": {
    "strategy": "parent_first",
    "chat_only_header": "X-Chat-Only",
    "forwarded_header": "X-Forwarded",
    "timeout_ms": 25000,
    "max_retries": 3,
    "fallback_to_local": true,
    "local_endpoint": "http://localhost:6000/v1/chat/completions",
    "reattempts_only_fallback": true
  },
  "heartbeat_interval_sec": 60,
  "re_register_interval_sec": 120
}
HERMESEOF
echo "[✓] Agent configuration created (role: ${AGENT_ROLE})"

# ── Health Check with Retry ──────────────────────────────────────────────────
health_check() {
  local max_attempts=30
  local attempt=1
  echo "[*] Waiting for proxy to start..."
  while [[ $attempt -le $max_attempts ]]; do
    if curl -s -m 2 "http://localhost:${PROXY_PORT}/health" >/dev/null 2>&1; then
      echo "[✓] Proxy health check passed"
      return 0
    fi
    sleep 1
    ((attempt++))
  done
  echo "[!] Proxy health check failed after ${max_attempts}s"
  return 1
}

# ── Register with Parent Proxy ───────────────────────────────────────────────
echo "[*] Registering with parent proxy..."
register_with_retry() {
  local max_attempts=5
  local delay=2
  local attempt=1
  
  while [[ $attempt -le $max_attempts ]]; do
    if REG_RESP=$(curl -s -m 10 -X POST "${PARENT_URL}/api/proxy?action=register" \
      -H "Content-Type: application/json" \
      -d "$(cat ${MACHINE_JSON})" 2>/dev/null); then
      echo "[✓] Registration successful: ${REG_RESP}"
      return 0
    fi
    
    if [[ $attempt -lt $max_attempts ]]; then
      echo "[*] Retry $attempt/$max_attempts in ${delay}s..."
      sleep $((delay * attempt))
      attempt=$((attempt + 1))
    fi
  done
  echo "[!] Registration failed after $max_attempts attempts"
  return 1
}

register_with_retry || echo "[!] Warning: Registration may have failed"

# ── Configure Hermes Agent (if installed) ──────────────────────────────────────
configure_hermes_agent() {
  local hermes_bin=""
  if command -v hermes-agent >/dev/null 2>&1; then
    hermes_bin="hermes-agent"
  elif [[ -f "${HOME}/.local/bin/hermes-agent" ]]; then
    hermes_bin="${HOME}/.local/bin/hermes-agent"
  fi
  
  if [[ -n "$hermes_bin" ]]; then
    echo "[*] Hermes agent found: $hermes_bin"
    mkdir -p "${HOME}/.hermes-live"
    cat > "${HOME}/.hermes-live/config.json" << HERMESCONF
{
  "name": "fcukproxy-hermes",
  "parent_url": "${PARENT_URL}/api/proxy",
  "machine_id": "${MACHINE_ID}",
  "role": "${AGENT_ROLE}",
  "routing": {
    "strategy": "parent_first",
    "retries_first": true,
    "fallback_to_local": true,
    "reattempts_only_fallback": true,
    "local_endpoint": "http://localhost:6000/v1/chat/completions",
    "timeout_ms": 25000,
    "max_retries": 3
  },
  "heartbeat_interval_sec": 60
}
HERMESCONF
    echo "[✓] Hermes agent configured"
  else
    echo "[*] Hermes agent not found. Install with: npm install -g hermes-agent"
  fi
}

configure_hermes_agent

# ── Print Summary ───────────────────────────────────────────────────────────
LOCAL_IP=$(get_local_ip)
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  FCUK Proxy Installation Complete v${FCUK_VERSION}"
echo "══════════════════════════════════════════════════════════"
echo "  Machine ID:    ${MACHINE_ID}"
echo "  Machine Name:  $(hostname)"
echo "  Local IP:      ${LOCAL_IP}"
echo "  Proxy Port:    ${PROXY_PORT}"
echo "  Parent URL:    ${PARENT_URL}"
echo "  Config:        ${MACHINE_JSON}"
echo "  Log:           ${MACHINE_DIR}/proxy.log"
echo "  Role:          ${AGENT_ROLE}"
echo ""
echo "  Your child proxy will appear on:"
echo "  → ${PARENT_URL}/api/proxy?action=health"
echo "  within 60 seconds."
echo ""
echo "  One-liner (share this):"
echo "  curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash"
echo ""
if [[ "$IS_TERMUX" == "true" ]]; then
  echo "  ── Termux/Android Notes ──────────────────────────────────"
  echo "  • Keep alive: termux-wake-lock (install termux-api)"
  echo "  • Auto-start: Install termux-services for boot scripts"
  echo "  • Check logs: cat ${MACHINE_DIR}/proxy.log"
  echo "  • Stop proxy: pkill -f child-proxy.mjs"
  echo "  • Battery: Disable optimization in Android Settings → Apps → Termux"
fi
echo "══════════════════════════════════════════════════════════"