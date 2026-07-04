#!/usr/bin/env bash
# Phone Child Proxy Installer (Termux/Android)
# Usage: curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy/install.sh | bash

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# FCUK Proxy — Universal Child Proxy Installer
# Supports: Linux (apt/yum/apk) and Termux (pkg)
# Usage: curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
#
# Architecture:
#   This machine becomes a CHILD PROXY on the financecheque.uk network.
#   - child-proxy.mjs: listens on port 4001 for OpenAI-compatible requests
#   - Hermes agent: routes chat queries through parent proxy first
#   - Heartbeat: reports alive every 60s to parent proxy
#   - LLM fallback: queries local LLM only after retry exhaustion
#
# Routing Logic (Boolean):
#   C = Chat-only query  F = Already forwarded by parent
#   Route: ¬F → child proxy → parent proxy → other child proxies
#          F  → local LLM ONLY (prevents loop)
# ═══════════════════════════════════════════════════════════════════════════

MACHINE_DIR="${HOME}/.fcukproxy"
MACHINE_JSON="${MACHINE_DIR}/machine.json"
PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
MACHINE_ID=""
MACHINE_NAME=""

# ── Detect OS ────────────────────────────────────────────────────────────
IS_TERMUX=false
if [[ -n "${TERMUX_VERSION:-}" || "$(uname -o 2>/dev/null)" == "Android" || -d "/data/data/com.termux" ]]; then
  IS_TERMUX=true
  PKG_MGR="pkg"
elif command -v apt >/dev/null 2>&1; then
  PKG_MGR="apt"
elif command -v yum >/dev/null 2>&1; then
  PKG_MGR="yum"
elif command -v apk >/dev/null 2>&1; then
  PKG_MGR="apk"
else
  PKG_MGR=""
fi

echo "═══ FCUK Proxy Installer ═══"
echo "OS: $(uname -a)"
$IS_TERMUX && echo "Mode: Termux"
echo ""

# ── Install Dependencies ─────────────────────────────────────────────────
install_deps() {
  if command -v node >/dev/null 2>&1; then
    echo "[✓] Node.js $(node -v)"
    return
  fi
  echo "[*] Installing Node.js..."
  case "${PKG_MGR}" in
    pkg) pkg install -y nodejs npm 2>/dev/null || pkg install -y nodejs ;;
    apt) sudo apt update && sudo apt install -y nodejs npm ;;
    yum) sudo yum install -y nodejs ;;
    apk) apk add nodejs npm ;;
    *)
      echo "[!] No package manager found. Install Node.js manually: https://nodejs.org"
      exit 1
      ;;
  esac
}

install_deps

# ── Create Machine Identity ──────────────────────────────────────────────
mkdir -p "${MACHINE_DIR}"

if [[ -f "${MACHINE_JSON}" ]]; then
  MACHINE_ID=$(python3 -c "import json; print(json.load(open('${MACHINE_JSON}')).get('machine_id', ''))" 2>/dev/null || echo "")
  if [[ -z "${MACHINE_ID}" ]]; then
    MACHINE_ID="$(date +%s | md5sum | head -c 32)"
  fi
  echo "[*] Using existing machine identity: ${MACHINE_ID}"
else
  MACHINE_ID="$(date +%s | md5sum | head -c 32 || echo "child-$(hostname)-$(date +%s)")"
  MACHINE_NAME="$(hostname 2>/dev/null || echo 'unknown')"
  AGENT_ROLE="${AGENT_ROLE:-chat}"
  cat > "${MACHINE_JSON}" << MACHINEEOF
{
  "machine_id": "${MACHINE_ID}",
  "machine_name": "${MACHINE_NAME}",
  "local_ip": "",
  "proxy_port": 4001,
  "parent": "${PARENT_URL}/api/proxy",
  "version": "0.5.0",
  "role": "${AGENT_ROLE}"
}
MACHINEEOF
  echo "[✓] Created machine identity: ${MACHINE_ID}"
fi

# ── Download child-proxy.mjs ──────────────────────────────────────────────
echo "[*] Downloading child proxy..."
curl -fsSL "${PARENT_URL}/fcukproxy/child-proxy.mjs" -o "${MACHINE_DIR}/child-proxy.mjs" 2>/dev/null || \
  curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy/child-proxy.mjs" -o "${MACHINE_DIR}/child-proxy.mjs"

chmod +x "${MACHINE_DIR}/child-proxy.mjs"

# ── Download Hermes configuration ────────────────────────────────────────
echo "[*] Configuring agent routing..."
mkdir -p "${MACHINE_DIR}/hermes"
AGENT_ROLE="${AGENT_ROLE:-chat}"

cat > "${MACHINE_DIR}/hermes/hermes.json" << HERMESEOF
{
  "name": "fcukproxy-hermes",
  "version": "0.5.0",
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

# ── Install child-proxy.mjs dependencies ─────────────────────────────────
echo "[*] Installing proxy dependencies..."
cd "${MACHINE_DIR}"
npm init -y >/dev/null 2>&1 || true

# ── Register with Parent Proxy ───────────────────────────────────────────
echo "[*] Registering with parent proxy..."
REG_RESP=$(curl -s -m 10 -X POST "${PARENT_URL}/api/proxy?action=register" \
  -H "Content-Type: application/json" \
  -d "$(cat ${MACHINE_JSON})" 2>/dev/null || echo "")
if [[ -n "${REG_RESP}" ]]; then
  echo "[✓] Registration successful: ${REG_RESP}"
else
  echo "[!] Registration may have failed (parent may be unreachable)"
fi

# ── Start child-proxy.mjs ─────────────────────────────────────────────────
echo "[*] Starting child proxy..."
export PORT=4001
export CHILD_ID="${MACHINE_ID}"
export MACHINE_NAME="$(hostname)"
export AGENT_ROLE="${AGENT_ROLE}"

nohup node "${MACHINE_DIR}/child-proxy.mjs" > "${MACHINE_DIR}/proxy.log" 2>&1 &
PROXY_PID=$!
echo "[✓] Child proxy started (PID: ${PROXY_PID}, port: 4001)"
sleep 1

# ── Set up Heartbeat ──────────────────────────────────────────────────────
setup_heartbeat() {
  local cron_job="* * * * * curl -s -m 5 -X POST ${PARENT_URL}/api/proxy?action=heartbeat -H 'Content-Type: application/json' -d '{\"machine_id\":\"${MACHINE_ID}\",\"machine_name\":\"$(hostname)\"}' >/dev/null 2>&1"
  if $IS_TERMUX; then
    if command -v crond >/dev/null 2>&1; then
      (crontab -l 2>/dev/null; echo "${cron_job}") | crontab -
      echo "[✓] Heartbeat cron installed"
    else
      nohup bash -c "while true; do curl -s -m 5 -X POST ${PARENT_URL}/api/proxy?action=heartbeat -H 'Content-Type: application/json' -d '{\"machine_id\":\"${MACHINE_ID}\",\"machine_name\":\"$(hostname)\"}' >/dev/null 2>&1; sleep 60; done" > "${MACHINE_DIR}/heartbeat.log" 2>&1 &
      echo "[✓] Heartbeat loop started (PID: $!)"
    fi
  else
    if command -v systemctl >/dev/null 2>&1; then
      mkdir -p "${HOME}/.config/systemd/user"
      cat > "${HOME}/.config/systemd/user/fcukproxy-heartbeat.service" << SERVICEEOF
[Unit]
Description=FCUK Proxy Heartbeat
After=network.target

[Service]
Type=oneshot
ExecStart=curl -s -m 5 -X POST ${PARENT_URL}/api/proxy?action=heartbeat -H 'Content-Type: application/json' -d '{"machine_id":"${MACHINE_ID}","machine_name":"$(hostname)"}'

[Install]
WantedBy=timers.target
TIMEREOF
      cat > "${HOME}/.config/systemd/user/fcukproxy-heartbeat.timer" << TIMEREOF
[Unit]
Description=FCUK Proxy Heartbeat Timer

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min

[Install]
WantedBy=timers.target
TIMEREOF
      systemctl --user daemon-reload 2>/dev/null || true
      systemctl --user enable fcukproxy-heartbeat.timer 2>/dev/null || true
      systemctl --user start fcukproxy-heartbeat.timer 2>/dev/null || true
      echo "[✓] Heartbeat systemd timer installed"
    else
      (crontab -l 2>/dev/null; echo "${cron_job}") | crontab - 2>/dev/null || {
        nohup bash -c "while true; do curl -s -m 5 -X POST ${PARENT_URL}/api/proxy?action=heartbeat -H 'Content-Type: application/json' -d '{\"machine_id\":\"${MACHINE_ID}\",\"machine_name\":\"$(hostname)\"}' >/dev/null 2>&1; sleep 60; done" > "${MACHINE_DIR}/heartbeat.log" 2>&1 &
        echo "[✓] Heartbeat loop started (PID: $!)"
      }
    fi
  fi
}

setup_heartbeat

# ── Configure Hermes Agent (if installed) ─────────────────────────────────
if command -v hermes-agent >/dev/null 2>&1 || [[ -f "${HOME}/.local/bin/hermes-agent" ]]; then
  HERMES_BIN="${HOME}/.local/bin/hermes-agent"
  echo "[*] Hermes agent found at ${HERMES_BIN}"
  mkdir -p "${HOME}/.hermes-live"
  cat > "${HOME}/.hermes-live/config.json" << CONFIGEOF
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
CONFIGEOF
  echo "[✓] Hermes agent configured"
else
  echo "[*] Hermes agent not found. Install with: npm install -g hermes-agent"
fi

# ── Print Summary ─────────────────────────────────────────────────────────
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $NF; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "unknown")
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  FCUK Proxy Installation Complete"
echo "══════════════════════════════════════════════════════════"
echo "  Machine ID:    ${MACHINE_ID}"
echo "  Machine Name:  $(hostname)"
echo "  Local IP:      ${LOCAL_IP}"
echo "  Proxy Port:    4001"
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
echo "══════════════════════════════════════════════════════════"