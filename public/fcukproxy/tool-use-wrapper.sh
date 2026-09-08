#!/usr/bin/env bash
# tool-use-wrapper.sh — Ensure agent backends have terminal execution capabilities
#
# The child-proxy agent must be able to execute terminal commands. When kilo/
# opencode are spawned by the task-router in non-interactive mode, they may
# not load the full tool catalog unless explicitly configured. This wrapper
# ensures the environment is set up so that shell/tool access works.
#
# Usage: tool-use-wrapper.sh <backend> <task>
#   backend — "kilo", "opencode", or "kiro"
#   task    — the task string to execute
#
# Environment:
#   TOOL_USE_DEBUG — set to 1 for verbose output

set -euo pipefail

DEBUG="${TOOL_USE_DEBUG:-0}"
# NB: must never return non-zero — this script runs under `set -e`, and a
# failing `log` (DEBUG=0) would abort before the backend ever spawns.
log() { [[ "$DEBUG" == "1" ]] && echo "[tool-use-wrapper] $*" >&2 || true; }

BACKEND="${1:-}"
TASK="${2:-}"

if [[ -z "$BACKEND" || -z "$TASK" ]]; then
  echo "Usage: tool-use-wrapper.sh <backend> <task>" >&2
  exit 1
fi

# ── Permission templates ────────────────────────────────────────────────
# Both kilo and opencode consume the same permission schema. Grants:
#   * external_directory — filesystem access OUTSIDE the cwd. Without it,
#     non-interactive `run` cannot answer opencode/kilo's "ask" prompt, so
#     any real file work (~/Documents, ~/Downloads, etc.) is REFUSED. This
#     is the v1.11.45 fix for agentic tasks being declined.
#   * bash / edit / webfetch — tool access within those locations.
PERMISSION_TEMPLATE='{
  "permission": {
    "external_directory": "allow",
    "bash": "allow",
    "edit": "allow",
    "webfetch": "allow"
  }
}'

ensure_kilo_config() {
  local CONFIG_DIR="$HOME/.config/kilo"
  local CONFIG_FILE="$CONFIG_DIR/kilo.jsonc"

  mkdir -p "$CONFIG_DIR"

  # Create when missing, or rewrite an existing config that could otherwise
  # refuse real file work (missing external_directory / stale v2 permissions).
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log "Creating kilo config with full tool + external_directory access"
    printf '{\n  "$schema": "https://app.kilo.ai/config.json",\n%s\n}\n' "$PERMISSION_TEMPLATE" > "$CONFIG_FILE"
  elif ! grep -q '"external_directory"' "$CONFIG_FILE" || grep -q '"permissions"' "$CONFIG_FILE"; then
    log "Repairing kilo config (missing external_directory or v2 'permissions') -> v1 full access"
    printf '{\n  "$schema": "https://app.kilo.ai/config.json",\n%s\n}\n' "$PERMISSION_TEMPLATE" > "$CONFIG_FILE"
  fi
}

ensure_opencode_config() {
  local CONFIG_DIR="$HOME/.config/opencode"
  mkdir -p "$CONFIG_DIR"

  # OpenCode uses opencode.json for configuration. V1 configs use the
  # singular "permission" key ("permissions" = v2, rejected by opencode 1.x).
  local CONFIG_FILE="$CONFIG_DIR/opencode.json"
  # Create when missing, or repair an existing config that still carries the
  # v2 "permissions" key (opencode 1.x refuses to start) or lacks
  # external_directory access (agentic tasks on user files get refused).
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log "Creating opencode config with full tool + external_directory access"
    printf '{\n  "$schema": "https://opencode.ai/config.json",\n%s\n}\n' "$PERMISSION_TEMPLATE" > "$CONFIG_FILE"
  elif grep -q '"permissions"' "$CONFIG_FILE" || ! grep -q '"external_directory"' "$CONFIG_FILE"; then
    log "Repairing opencode config (v2 'permissions' or missing external_directory) -> v1 full access"
    printf '{\n  "$schema": "https://opencode.ai/config.json",\n%s\n}\n' "$PERMISSION_TEMPLATE" > "$CONFIG_FILE"
  fi
}

# ── Pre-flight checks ────────────────────────────────────────────────────
check_backend() {
  local backend="$1"
  # Some backends expose a differently-named binary (kiro -> kiro-cli).
  local bin_name
  case "$backend" in
    kiro) bin_name="kiro-cli" ;;
    *) bin_name="$backend" ;;
  esac
  local bin_var="${backend^^}_BIN"
  bin_var="${bin_var:-$bin_name}"

  local bin_path
  bin_path=$(command -v "$bin_var" 2>/dev/null || command -v "$bin_name" 2>/dev/null || command -v "$backend" 2>/dev/null || true)

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
    # kilo run executes non-interactively; tools must be configured via the
    # config file (ensured above).
    exec "$BIN_PATH" run "$TASK"
    ;;
  opencode)
    ensure_opencode_config
    exec "$BIN_PATH" run "$TASK"
    ;;
  kiro)
    # kiro-cli shares the opencode permission schema for fs_write/fs_read;
    # ensure the same config so real file work is granted, not refused.
    ensure_opencode_config
    # kiro-cli (npm: @aws/kiro-cli) takes a chat subcommand; --trust-all-tools
    # runs agentic prompts end-to-end without per-tool confirmation.
    exec "$BIN_PATH" chat --no-interactive --trust-all-tools "$TASK"
    ;;
  *)
    echo "ERROR: Unknown backend '$BACKEND'. Use 'kilo' or 'opencode'." >&2
    exit 1
    ;;
esac
