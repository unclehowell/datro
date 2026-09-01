#!/usr/bin/env bash
# tool-use-wrapper.sh — Ensure agent backends have terminal execution capabilities
#
# The child-proxy agent must be able to execute terminal commands. When kilo/
# opencode are spawned by the task-router in non-interactive mode, they may
# not load the full tool catalog unless explicitly configured. This wrapper
# ensures the environment is set up so that shell/tool access works.
#
# Usage: tool-use-wrapper.sh <backend> <task>
#   backend — "kilo" or "opencode"
#   task    — the task string to execute
#
# Environment:
#   TOOL_USE_DEBUG — set to 1 for verbose output

set -euo pipefail

DEBUG="${TOOL_USE_DEBUG:-0}"
log() { [[ "$DEBUG" == "1" ]] && echo "[tool-use-wrapper] $*" >&2; }

BACKEND="${1:-}"
TASK="${2:-}"

if [[ -z "$BACKEND" || -z "$TASK" ]]; then
  echo "Usage: tool-use-wrapper.sh <backend> <task>" >&2
  exit 1
fi

# ── Ensure config dirs exist ─────────────────────────────────────────────
ensure_kilo_config() {
  local CONFIG_DIR="$HOME/.config/kilo"
  local CONFIG_FILE="$CONFIG_DIR/kilo.jsonc"

  mkdir -p "$CONFIG_DIR"

  # If no config exists, create one that explicitly allows bash/tool use
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log "Creating kilo config with bash allowed"
    cat > "$CONFIG_FILE" <<'KILOEOF'
{
  "$schema": "https://app.kilo.ai/config.json",
  "permission": {
    "bash": "allow"
  }
}
KILOEOF
  fi
}

ensure_opencode_config() {
  local CONFIG_DIR="$HOME/.config/opencode"
  mkdir -p "$CONFIG_DIR"

  # OpenCode uses opencode.json for configuration
  local CONFIG_FILE="$CONFIG_DIR/opencode.json"
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log "Creating opencode config"
    cat > "$CONFIG_FILE" <<'OPEOF'
{
  "permissions": {
    "bash": "allow"
  }
}
OPEOF
  fi
}

# ── Pre-flight checks ────────────────────────────────────────────────────
check_backend() {
  local backend="$1"
  local bin_var="${backend^^}_BIN"
  bin_var="${bin_var:-$backend}"

  local bin_path
  bin_path=$(command -v "$bin_var" 2>/dev/null || command -v "$backend" 2>/dev/null || true)

  if [[ -z "$bin_path" ]]; then
    echo "ERROR: $backend not found in PATH. Install it first." >&2
    return 1
  fi

  log "Found $backend at $bin_path"
  echo "$bin_path"
}

# ── Main ─────────────────────────────────────────────────────────────────
log "Backend: $BACKEND, Task: ${TASK:0:60}..."

BIN_PATH=$(check_backend "$BACKEND") || {
  echo '{"error": "backend_not_found", "backend": "'"$BACKEND"'"}'
  exit 1
}

case "$BACKEND" in
  kilo)
    ensure_kilo_config
    # kilo --chat runs in non-interactive mode; tools must be configured
    # via the config file which we ensured above
    exec "$BIN_PATH" --chat "$TASK"
    ;;
  opencode)
    ensure_opencode_config
    exec "$BIN_PATH" run "$TASK"
    ;;
  *)
    echo "ERROR: Unknown backend '$BACKEND'. Use 'kilo' or 'opencode'." >&2
    exit 1
    ;;
esac
