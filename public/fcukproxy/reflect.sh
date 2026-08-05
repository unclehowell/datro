#!/usr/bin/env bash
# reflect.sh — Sleep-time compute for the child proxy.
# Runs nightly (see install.sh cron): reviews the day's trace.jsonl + order
# strategy output and distills durable lessons into memory.md. This is the
# "sleep-time compute" pattern: the node learns from its own traces offline,
# so it re-derives less from the LLM on future long-horizon tasks.

set -uo pipefail

FCUK_DIR="${HOME}/.fcukproxy"
TRACE_FILE="${FCUK_DIR}/trace.jsonl"
MEMORY_FILE="${FCUK_DIR}/memory.md"
LOG_FILE="${FCUK_DIR}/reflect.log"
DATE=$(date +%Y-%m-%d)
MACHINE_ID="${MACHINE_ID:-unknown}"

log() { echo "[$(date -Iseconds 2>/dev/null || date)] $*" >> "$LOG_FILE"; }

[[ -f "$TRACE_FILE" ]] || { log "no traces found; skipping"; exit 0; }

mkdir -p "$FCUK_DIR"
[[ -f "$MEMORY_FILE" ]] || : > "$MEMORY_FILE"

log "Daily reflection start (date=$DATE)"

# Count today's leads by kind (source of truth is the trace log).
TOTAL_ITERS=$(grep -c '"kind":"iter"' "$TRACE_FILE" 2>/dev/null || true)
TOTAL_LEADS=$(grep -c '"kind":"lead"' "$TRACE_FILE" 2>/dev/null || true)
LEAD_OK=$(grep -c '"ok"' "$TRACE_FILE" 2>/dev/null || true)
LEAD_FAIL=$(grep -c 'leadderr' "$TRACE_FILE" 2>/dev/null || true)

log "reviewed ${TOTAL_ITERS} iterations, ${TOTAL_LEADS} leads (${LEAD_OK} ok / ${LEAD_FAIL} fail)"

# Compile a compact daily digest for memory. Pure shell — no LLM needed, so a
# reflect pass costs nothing even on a low-spec node.
cat > "${FCUK_DIR}/.reflect-digest-$DATE.md" << EOF | log "wrote digest"
## Daily digest $DATE (node $MACHINE_ID)
- Iterations run today: ${TOTAL_ITERS}
- Leads reported: ${TOTAL_LEADS} (${LEAD_OK} ok / ${LEAD_FAIL} fail)
- Work dirs: $(ls -1 "${FCUK_DIR}/campaigns" 2>/dev/null | wc -l) order(s)
EOF

# Append a dated digest line to persistent memory (only the numbers, cheap).
{
  echo ""
  echo "## Digest $DATE — iters=${TOTAL_ITERS} leads=${TOTAL_LEADS} fail=${LEAD_FAIL}"
} >> "$MEMORY_FILE"

log "Daily reflection complete"