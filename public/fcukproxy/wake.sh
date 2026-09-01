#!/usr/bin/env bash
# ─── wake.sh — on-demand dependency wrapper ──────────────────────────────
# Thin-client policy: NOTHING LLM runs continuously. Only the port-3000
# WebGUI (agentos-gui.service) is enabled at boot. This script is the single
# knob for turning the rest of the stack on and back off again:
#
#   wake.sh wake   → start the child-proxy + the Main Agent LLM stack
#                    (ollama:11434, omniroute:20128, task-router:3200)
#   wake.sh sleep  → stop the whole dependency stack again
#   wake.sh status → report which deps are currently up
#   wake.sh wake child   → ONLY the child-proxy (port 4001)
#   wake.sh wake llm     → ONLY the LLM stack (ollama + omniroute + task-router)
#
# The GUI's llm-gate (ensureLLMStack) and the chat route already do the
# wake-on-prompt / release-after-answer dance automatically; this is the
# explicit, scripted equivalent for manual or parent-prompt use.
# ────────────────────────────────────────────────────────────────────────
set -euo pipefail

HOME_DIR="${HOME:-/home/x}"
FCUK_DIR="$HOME_DIR/.fcukproxy"

log() { echo "[wake] $*"; }

user_svc() { local name="$1" act="$2"; systemctl --user "$act" "$name.service" 2>/dev/null || true; }
user_active() { [ "$(systemctl --user is-active "$1.service" 2>/dev/null)" = "active" ]; }
port_open() { timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/$1" 2>/dev/null; }

CHILD_PROXY_UNIT="fcukproxy-child"

wake_child() {
  if ! user_active "$CHILD_PROXY_UNIT"; then
    user_svc "$CHILD_PROXY_UNIT" start
    log "child-proxy (fcukproxy-child, :4001) started"
  else
    log "child-proxy already active"
  fi
}

sleep_child() {
  if user_active "$CHILD_PROXY_UNIT"; then
    user_svc "$CHILD_PROXY_UNIT" stop
    log "child-proxy stopped"
  fi
}

wake_llm() {
  # Main Agent stack — mirrors hermes-main.sh / llm-gate ensureLLMStack.
  if ! port_open 11434; then
    log "starting system ollama (:11434)"
    sudo -n systemctl start ollama 2>/dev/null || log "WARN: system ollama failed to start"
  fi
  if ! user_active omniroute; then
    user_svc omniroute start
    log "omniroute (:20128) started"
  fi
  if ! user_active task-router; then
    user_svc task-router start
    log "task-router (:3200) started"
  fi
}

sleep_llm() {
  if user_active task-router; then
    user_svc task-router stop
    log "task-router stopped"
  fi
  if user_active omniroute; then
    user_svc omniroute stop
    log "omniroute stopped"
  fi
  if port_open 11434 || systemctl is-active ollama >/dev/null 2>&1; then
    sudo -n systemctl stop ollama 2>/dev/null || log "WARN: could not stop ollama"
    log "ollama stopped"
  fi
}

status() {
  echo "child-proxy (fcukproxy-child :4001): $(user_active "$CHILD_PROXY_UNIT" && echo up || echo down)"
  echo "omniroute    (:20128):               $(user_active omniroute && echo up || echo down)"
  echo "task-router  (:3200):                $(user_active task-router && echo up || echo down)"
  echo "ollama       (:11434, system):       $( (port_open 11434 || systemctl is-active ollama >/dev/null 2>&1) && echo up || echo down)"
}

cmd="${1:-status}"
scope="${2:-all}"
case "$cmd" in
  wake)
    case "$scope" in
      child) wake_child ;;
      llm) wake_llm ;;
      all) wake_child; wake_llm ;;
      *) echo "usage: $0 wake [child|llm|all]" >&2; exit 2 ;;
    esac
    log "stack awake (scope: $scope)"
    ;;
  sleep)
    case "$scope" in
      child) sleep_child ;;
      llm) sleep_llm ;;
      all) sleep_child; sleep_llm ;;
      *) echo "usage: $0 sleep [child|llm|all]" >&2; exit 2 ;;
    esac
    log "stack asleep (scope: $scope)"
    ;;
  status) status ;;
  *) echo "usage: $0 wake|sleep|status [child|llm|all]" >&2; exit 2 ;;
esac