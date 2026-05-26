#!/usr/bin/env bash
# Flywheel Diagnostic — run from AWS or local to check system health
set -euo pipefail

echo "=== FLYWHEEL DIAGNOSTIC $(date -u) ==="

# 1. File versions
echo "--- File versions ---"
for f in multi-branch-release.sh intelligence.py; do
  local_f="$HOME/.fcukproxy/$f"
  repo_f="$HOME/datro/flywheel/$f"
  if [ -f "$local_f" ]; then
    hits=$(grep -c 'record_daily\|daily_fixes' "$local_f" 2>/dev/null || echo 0)
    size=$(wc -c < "$local_f" 2>/dev/null || echo 0)
    mtime=$(stat -c '%y' "$local_f" 2>/dev/null | head -c 19 || echo "unknown")
    echo "  .fcukproxy/$f: $hits new-features, ${size}B, mod $mtime"
  fi
  if [ -f "$repo_f" ]; then
    hits=$(grep -c 'record_daily\|daily_fixes' "$repo_f" 2>/dev/null || echo 0)
    echo "  datro/flywheel/$f: $hits new-features"
  fi
  if [ -f "$local_f" ] && [ -f "$repo_f" ]; then
    if diff -q "$local_f" "$repo_f" >/dev/null 2>&1; then
      echo "    MATCH"
    else
      echo "    MISMATCH"
    fi
  fi
done

# 2. Cron status
echo "--- Cron ---"
crontab -l 2>/dev/null | grep -v '^#' | while read -r line; do
  echo "  $line"
done

# 3. Lockfile
echo "--- Lockfile ---"
if [ -f /tmp/multi-branch-release.lock ]; then
  pid=$(cat /tmp/multi-branch-release.lock)
  if kill -0 "$pid" 2>/dev/null; then
    echo "  LOCKED by PID $pid (RUNNING)"
  else
    echo "  STALE lock from PID $pid"
  fi
  mtime=$(stat -c '%y' /tmp/multi-branch-release.lock 2>/dev/null | head -c 19 || echo "unknown")
  echo "  created: $mtime"
else
  echo "  No lockfile (ready)"
fi

# 4. Daily uniqueness
echo "--- Daily uniqueness ---"
if [ -f "$HOME/.fcukproxy/agent/daily-unique.json" ]; then
  python3 -c "
import json
with open('$HOME/.fcukproxy/agent/daily-unique.json') as f:
    d = json.load(f)
print(f\"  Date: {d.get('date', 'N/A')}\")
print(f\"  Bugs today: {len(d.get('bugs', []))}\")
for b in d.get('bugs', []):
    print(f\"    - {b}\")
print(f\"  Features today: {len(d.get('features', []))}\")
for feat in d.get('features', []):
    print(f\"    - {feat}\")
"
else
  echo "  No daily file"
fi

# 5. Recent releases
echo "--- Recent releases (last 5) ---"
log="$HOME/logs/multi-branch-release.log"
if [ -f "$log" ]; then
  echo "  Log size: $(wc -l < "$log") lines"
  echo "  Last 5 release tags:"
  grep -oE '[a-z]+-v[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' "$log" | tail -5 | while read -r tag; do
    echo "    $tag"
  done
  echo "  Last 5 errors:"
  grep -iE 'error|fail|crash|sleep.*invalid|WARN' "$log" | tail -5 | while read -r line; do
    echo "    $line"
  done
else
  echo "  No log file"
fi

# 6. Syntax checks
echo "--- Syntax check ---"
for f in "$HOME/.fcukproxy/multi-branch-release.sh" "$HOME/datro/flywheel/multi-branch-release.sh"; do
  if [ -f "$f" ]; then
    if bash -n "$f" 2>/dev/null; then
      echo "  $f: bash OK"
    else
      echo "  $f: BASH ERROR"
    fi
  fi
done
for f in "$HOME/.fcukproxy/intelligence.py" "$HOME/datro/flywheel/intelligence.py"; do
  if [ -f "$f" ]; then
    if python3 -c "import py_compile; py_compile.compile('$f', doraise=True)" 2>/dev/null; then
      echo "  $f: python OK"
    else
      echo "  $f: PYTHON ERROR"
    fi
  fi
done

echo "=== DIAGNOSTIC COMPLETE ==="
