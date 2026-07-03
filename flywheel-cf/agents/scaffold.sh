#!/usr/bin/env bash
# External Scaffolding Loader — Source this in any CLI/IDE agent
# Provides unified memory interface via cnei branch

BRAIN_ENDPOINT="${BRAIN_ENDPOINT:-https://cnei.datro.xyz/api/brain}"
HONCHO_ENDPOINT="${HONCHO_ENDPOINT:-https://api.honcho.dev/api/honcho/messages}"

# Get branch from argument or environment
SCAFFOLD_BRANCH="${1:-${FLYWHEEL_BRANCH:-cnei}}"

# Fetch and cache scaffolding config
load_scaffolding() {
    local branch="${1:-$SCAFFOLD_BRANCH}"
    curl -s "${BRAIN_ENDPOINT}/config/${branch}" 2>/dev/null || echo '{"error":"config_unavailable"}'
}

# Remember something to shared memory
brain_remember() {
    local branch="${1:-$SCAFFOLD_BRANCH}"
    local key="$2"
    local content="$3"
    curl -s -X POST "${BRAIN_ENDPOINT}/remember/${branch}/${key}" \
        -H "Content-Type: application/json" \
        -d "{\"content\":\"$content\",\"source\":\"cli\"}" 2>/dev/null
}

# Recall memory by key
brain_recall() {
    local branch="${1:-$SCAFFOLD_BRANCH}"
    local key="$2"
    curl -s "${BRAIN_ENDPOINT}/memory/${branch}/${key}" 2>/dev/null
}

# Get lessons learned
brain_lessons() {
    local branch="${1:-$SCAFFOLD_BRANCH}"
    curl -s "${BRAIN_ENDPOINT}/lessons/${branch}?limit=${2:-20}" 2>/dev/null
}

# Get agent configuration
brain_config() {
    local branch="${1:-$SCAFFOLD_BRANCH}"
    curl -s "${BRAIN_ENDPOINT}/config/${branch}" 2>/dev/null
}

# Sync honcho to brain
sync_honcho() {
    local branch="${1:-$SCAFFOLD_BRANCH}"
    local token="$2"
    node "${DATRO_ROOT:-/home/unclehowell/datro}/flywheel-cf/agents/honcho-bridge.js" sync-honcho "$branch"
}

# Quick status check
brain_status() {
    echo "Branch: ${SCAFFOLD_BRANCH}"
    echo "Config endpoint: ${BRAIN_ENDPOINT}/config/${SCAFFOLD_BRANCH}"
    echo "Lessons endpoint: ${BRAIN_ENDPOINT}/lessons/${SCAFFOLD_BRANCH}"
}

# Export functions for use
export -f load_scaffolding brain_remember brain_recall brain_lessons brain_config sync_honcho brain_status