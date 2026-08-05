#!/usr/bin/env bash
# campaign-exec.sh — Long-horizon lead-generation campaign executor
# Reads a campaign task JSON from stdin, runs a multi-step agentic campaign
# via opencode/kilo + local/cloud LLMs, reports leads to the parent.
#
# Context-engineering harness (per long-horizon best practices):
#   • Filesystem as context store — full iteration output goes to disk; next
#     iteration only sees a compact summary, so long campaigns stay cheap.
#   • Memory — an agent-editable ~/.fcukproxy/memory.md persists lessons
#     across campaigns (nodes learn from their own runs instead of repeating).
#   • Skills — ~/.fcukproxy/skills/*.md are reusable procedure snippets loaded
#     into every prompt, reducing dependency on the LLM recalling them.
#   • Trace log — every step is appended to trace.jsonl (source of truth),
#     which reflect.sh (sleep-time compute) reviews nightly to distill memory.
#
# Task JSON format (from parent /api/proxy/order + dispatch):
# {
#   "action": "campaign",
#   "order_id": 12,
#   "machine_id": "...",
#   "target_url": "https://example.com",
#   "budget": 500,
#   "quantity": 10,
#   "lead_value": 50,
#   "prompt": "You are a FinanceCheque lead-generation campaign node..."
# }

set -uo pipefail

TASK_JSON=$(cat)
MACHINE_ID="${MACHINE_ID:-unknown}"
PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
LOG_FILE="${HOME}/.fcukproxy/campaign-exec.log"
FCUK_DIR="${HOME}/.fcukproxy"
TRACE_FILE="${FCUK_DIR}/trace.jsonl"
MEMORY_FILE="${FCUK_DIR}/memory.md"
SKILLS_DIR="${FCUK_DIR}/skills"

log() {
  echo "[$(date -Iseconds 2>/dev/null || date 2>/dev/null || echo unknown)] $*" >> "$LOG_FILE"
  echo "[campaign] $*" >&2
}

# trace <kind> <detail> — append a structured, context-engineering trace line.
trace() {
  local kind="$1" detail="${2:-}"
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u)
  mkdir -p "$FCUK_DIR"
  printf '{"ts":"%s","machine":"%s","order":%s,"kind":"%s","detail":"%s"}\n' \
    "$ts" "$MACHINE_ID" "$ORDER_ID" "$kind" "$(printf '%s' "$detail" | sed 's/"/\\"/g' | tr '\n' ' ' | head -c 400)" \
    >> "$TRACE_FILE" 2>/dev/null || true
}

get() {
  python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))" <<< "$TASK_JSON" 2>/dev/null || echo ""
}

ORDER_ID=$(get order_id)
TARGET_URL=$(get target_url)
QUANTITY=$(get quantity)
LEAD_VALUE=$(get lead_value)
PROMPT=$(get prompt)
CAMPAIGN_DIR="${FCUK_DIR}/campaigns/order-${ORDER_ID}"
OPTS_DIR="$CAMPAIGN_DIR/strategy"
mkdir -p "$OPTS_DIR" "$FCUK_DIR"

# ── Context assembly: memory + skills (the long-horizon harness) ─────────
# Compose a "base context" once so every iteration reuses node memory + skills
# without re-deriving them from the LLM each time.
assemble_context() {
  local ctx=""
  if [[ -f "$MEMORY_FILE" ]]; then
    ctx+=$'\n### NODE MEMORY (persistent, learnable)\n'
    ctx+="$(<"$MEMORY_FILE")"
  fi
  if [[ -d "$SKILLS_DIR" ]]; then
    for s in "$SKILLS_DIR"/*.md; do
      [[ -e "$s" ]] || continue
      ctx+=$'\n'"### SKILL: $(basename "$s" .md)"$'\n'
      ctx+="$(<"$s")"
    done
  fi
  printf '%s' "$ctx"
}

# ── Step 0: seed memory / skills if absent (idempotent) ───────────────────
if [[ ! -f "$MEMORY_FILE" ]]; then
  mkdir -p "$FCUK_DIR"
  cat > "$MEMORY_FILE" << 'MEOF'
# FinanceCheque Node Memory
Learned lessons persist here across campaigns. Add guardrails, approaches that
worked, and target notes. The nightly reflect.sh may append distillations too.
MEOF
fi
mkdir -p "$SKILLS_DIR"

log "Campaign start: order=$ORDER_ID target=$TARGET_URL qty=$QUANTITY lead_value=$LEAD_VALUE"
trace start "order=$ORDER_ID target=$TARGET_URL"

report_lead() {
  local source="$1" note="${2:-}"
  log "Reporting lead: source=$source note=$note"
  # Leads land as 'pending'; payout is credited by the server-side verify step.
  curl -sf -X POST "$PARENT_URL/api/proxy/lead" \
    -H 'Content-Type: application/json' \
    -H "X-FCUK-Token: ${FCUK_LOCAL_TOKEN:-}" \
    -d "{\"order_id\":$ORDER_ID,\"machine_id\":\"$MACHINE_ID\",\"status\":\"pending\",\"source\":\"$source\"}" \
    >/dev/null 2>&1 \
    && { trace lead "order=$ORDER_ID source=$source ok"; log "Lead reported OK (source=$source)"; } \
    || { trace leaderr "order=$ORDER_ID source=$source" ; log "Lead report failed (source=$source)"; }
}

# ── Step 2: Agentic campaign via opencode/kilo ───────────────────────────
BASE_CONTEXT="$(assemble_context)"

if command -v opencode >/dev/null 2>&1; then
  log "Running campaign with opencode"
  for i in $(seq 1 "$QUANTITY" 2>/dev/null || seq 1 5); do
    trace iter "opencode iter=$i order=$ORDER_ID"
    timeout 240 opencode --non-interactive -m \
      "$PROMPT

$BASE_CONTEXT

Iteration $i of $QUANTITY (est.):
Produce an original marketing asset for $TARGET_URL and report it as a lead.
Write named bullet points describing the audience touched and any qualifying lead captured.
Full work product goes to $OPTS_DIR/iter-$i.txt; only a one-line summary stays in memory.
Also save a brief 'lessons learned' line for this node." \
      2>&1 | tee "$OPTS_DIR/iter-$i.txt" >/dev/null 2>/dev/null
    report_lead "opencode-iter$i"
    sleep 2
  done
elif command -v kilo >/dev/null 2>&1; then
  log "Running campaign with kilo"
  for i in $(seq 1 "${QUANTITY:-5}"); do
    trace iter "start=$i order=$ORDER_ID"
    timeout 240 kilo run "$PROMPT



$BASE_CONTEXT

$ (iteration $i of ${QUANTITY:-5}) — full output to $OPTS_DIR/kilo-$i.txt" \
      2>&1 | tee "$OPTS_DIR/kilo-$i.txt" >/dev/null 2>/dev/null
    report_lead "kilo-iter-$i"
    sleep 2
  done
else
  log "No agentic CLI (opencode/kilo) available — using fallback LLM via agent.py"
  AGENT_URL="http://127.0.0.1:${AGENT_PORT:-6100}"
  for i in $(seq 1 "${QUANTITY:-5}"); do
    trace iter "start=$i llm-fallback order=$ORDER_ID"
    python3 - "$PROMPT" "$TARGET_URL" "$i" "$BASE_CONTEXT" << 'PYEOF'
import json, os, sys, urllib.request
prompt, url, i, ctx = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
endpoint = f"http://127.0.0.1:{os.environ.get('AGENT_PORT','6100')}/v1/chat/completions"
body = {"model": "auto", "messages": [{"role": "user", "content": f"{prompt}\n{ctx}\nIteration {i}: draft an original marketing piece for {url}. Add a 'what worked' line."}]}
req = urllib.request.Request(endpoint, data=json.dumps(body).encode(), headers={"Content-Type":"application/json"})
try:
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode())
        print(data.get("choices",[{}])[0].get("message",{}).get("content",""))
except Exception as e:
    print(json.dumps({"error": str(e)}))
PYEOF
    report_lead "llm-iter-$i"
    sleep 1
  done
fi

# ── Step 3: append a durable "what worked" memory line this run ───────────
echo "- [$(date +%Y-%m-%d)] order $ORDER_ID target $TARGET_URL: ran $QUANTITY iterations via ${0/ /} (node $MACHINE_ID)" >> "$MEMORY_FILE" 2>/dev/null || true

# ── Step 4: Summarize ─────────────────────────────────────────────────────
trace done "order=$ORDER_ID leads=$QUANTITY"
cat << RESULT
{
  "status": "completed",
  "order_id": "$ORDER_ID",
  "target_url": "$TARGET_URL",
  "leads_reported": ${QUANTITY:-0},
  "lead_value": ${LEAD_VALUE:-0},
  "machine_id": "$MACHINE_ID",
  "work_dir": "$CAMPAIGN_DIR",
  "timestamp": "$(date -Iseconds 2>/dev/null || date)"
}
RESULT