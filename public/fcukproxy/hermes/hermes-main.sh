#!/usr/bin/env bash
# ─── Hermes Main Agent profile (hermes-proxy) ───────────────────────────
# The Main Agent is the LLM stack + agent that actually answers the chat:
#   ollama  (system service, port 11434, minicpm5-32k local model)
#   omniroute (user service, port 20128 — OpenAI-compatible proxy)
# If the `hermes` / `hermes-agent` CLI is installed it is also started so
# the GUI / delegates can reach it. Nothing about this profile starts on
# its own at boot — it is engaged on demand when you submit a chat prompt
# or press "Start" next to the Main Agent on the dashboard.
#
# Usage: hermes-main.sh start | stop | status
set -euo pipefail

HOME_DIR="${HOME:-/home/x}"
FCUK_DIR="$HOME_DIR/.fcukproxy"
HERMES_DIR="$FCUK_DIR/hermes"
STATE_FILE="$HERMES_DIR/main.state"
OLLAMA_MODELS_DIR="${OLLAMA_MODELS_DIR:-}"

log() { echo "[hermes-main] $*"; }

user_svc() { local name="$1" act="$2"; systemctl --user "$act" "$name.service" 2>/dev/null || true; }
user_active() { [ "$(systemctl --user is-active "$1.service" 2>/dev/null)" = "active" ]; }
port_open() { timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/$1" 2>/dev/null; }

# Use the systemd-managed ollama service exactly like the GUI's llm-gate.
# A systemd drop-in (ollama.service.d/models-override.conf) points OLLAMA_MODELS
# at this node's model cache where it lives outside the ollama user's home.
ensure_ollama() {
  if ! port_open 11434; then
    log "starting system ollama"
    sudo -n systemctl start ollama 2>/dev/null || {
      log "system ollama failed to start — model unavailable"
      return 1
    }
  fi
}

start_stack() {
  log "engaging Main Agent (local stack: ollama + omniroute + task-router)"
  ensure_ollama
  if ! user_active omniroute; then
    user_svc omniroute start
  fi
  if ! user_active task-router; then
    user_svc task-router start
  fi
  # Idle watchdog marker so the GUI knows the profile is engaged.
  mkdir -p "$HERMES_DIR"
  echo "started:$(date +%s)" > "$STATE_FILE"
  log "Main Agent engaged (ollama:11434, omniroute:20128, task-router:3200)"
}

stop_stack() {
  log "disengaging Main Agent"
  if user_active task-router; then
    user_svc task-router stop
  fi
  if user_active omniroute; then
    user_svc omniroute stop
  fi
  sudo -n systemctl stop ollama 2>/dev/null || true
  rm -f "$STATE_FILE"
}

cmd="${1:-status}"
case "$cmd" in
  start) start_stack ;;
  stop)  stop_stack ;;
  status)
    if [ -f "$STATE_FILE" ]; then echo "running"; else echo "stopped"; fi
    ;;
  *) echo "usage: $0 start|stop|status" >&2; exit 2 ;;
esac