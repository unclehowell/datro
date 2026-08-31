#!/usr/bin/env bash
# ─── Hermes Support Agent profile (hermes-local) ────────────────────────
# The Support Agent answers from the ollama-cloud (remote) LLM profile.
# Backend selection (in order of preference):
#   1. openclaw gateway installed  → `openclaw gateway --port 18789`
#   2. bundled zero-dependency `hermes-support.mjs` fallback daemon
# The profile NEVER runs a local model. It only runs when you press
# "Start" next to Support Agent on the dashboard. Stopping it (or
# submitting a chat prompt) disengages it so the main local stack can run.
#
# Usage: hermes-support.sh start | stop | status
set -euo pipefail

HOME_DIR="${HOME:-/home/x}"
FCUK_DIR="$HOME_DIR/.fcukproxy"
HERMES_DIR="$FCUK_DIR/hermes"
STATE_FILE="$HERMES_DIR/support.state"

log() { echo "[hermes-support] $*"; }

find_openclaw() {
  local c
  for c in "$HOME_DIR/.local/lib/node_modules/openclaw/dist/index.js" \
           "$HOME_DIR/.npm-global/lib/node_modules/openclaw/dist/index.js"; do
    if [ -f "$c" ]; then echo "$c"; return 0; fi
  done
  if command -v openclaw >/dev/null 2>&1; then command -v openclaw; return 0; fi
  return 1
}

start_support() {
  log "engaging Support Agent (ollama-cloud)"
  mkdir -p "$HERMES_DIR"
  local openclaw_bin
  if openclaw_bin="$(find_openclaw)"; then
    log "engine: openclaw gateway ($openclaw_bin)"
    NODE_BIN="${NODE_BIN:-$(command -v node || echo /usr/bin/node)}"
    exec "$NODE_BIN" "$openclaw_bin" gateway --port 18789
  else
    log "engine: bundled support daemon (openclaw not installed)"
    exec /usr/bin/node "$HERMES_DIR/hermes-support.mjs"
  fi
}

stop_support() {
  log "disengaging Support Agent"
  rm -f "$STATE_FILE"
  pkill -f "$HERMES_DIR/hermes-support.mjs" 2>/dev/null || true
  pkill -f "openclaw.*gateway --port 18789" 2>/dev/null || true
  return 0
}

cmd="${1:-status}"
case "$cmd" in
  start) start_support ;;
  stop)  stop_support ;;
  status)
    if pgrep -f "hermes-support.mjs|openclaw.*gateway --port 18789" >/dev/null 2>&1; then
      echo "running"
    else
      echo "stopped"
    fi
    ;;
  *) echo "usage: $0 start|stop|status" >&2; exit 2 ;;
esac