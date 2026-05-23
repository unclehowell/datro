#!/usr/bin/env bash
# Deploy new flywheel files to this AWS server.
# Run this on the AWS EC2 instance (13.135.142.244) to upgrade the flywheel.
# Usage: bash ~/datro/flywheel/deploy.sh

set -euo pipefail

FCUK_DIR="$HOME/.fcukproxy"
AGENT_DIR="$FCUK_DIR/agent"
REPO_DIR="$HOME/datro"
FLYWHEEL_DIR="$REPO_DIR/flywheel"

echo "=== Deploying flywheel upgrade ==="
echo ""

# 1. Ensure the cnei branch has the latest files
cd "$REPO_DIR"
git fetch origin cnei 2>&1
git checkout cnei 2>&1
git pull origin cnei 2>&1

# 2. Backup old scripts
BACKUP_DIR="$FCUK_DIR/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$FCUK_DIR/multi-branch-release.sh" "$BACKUP_DIR/" 2>/dev/null || true
cp "$FCUK_DIR/intelligence.py" "$BACKUP_DIR/" 2>/dev/null || true
echo "Backups in $BACKUP_DIR"

# 3. Copy new scripts
cp "$FLYWHEEL_DIR/multi-branch-release.sh" "$FCUK_DIR/"
cp "$FLYWHEEL_DIR/intelligence.py" "$FCUK_DIR/"
chmod +x "$FCUK_DIR/multi-branch-release.sh" "$FCUK_DIR/intelligence.py"
echo "Updated: multi-branch-release.sh, intelligence.py"

# 4. Copy agent directory
rm -rf "$AGENT_DIR"
cp -r "$FLYWHEEL_DIR/agent" "$AGENT_DIR"
echo "Updated: agent/ (soul.md, manifest.md, memory.md, heartbeat.sh, branches/*)"

# 5. Add fix_rotation/ux_rotation to state if missing
python3 -c "
import json
s = json.load(open('$FCUK_DIR/release-state.json'))
changed = False
if 'fix_rotation' not in s:
    s['fix_rotation'] = 0
    changed = True
if 'ux_rotation' not in s:
    s['ux_rotation'] = 0
    changed = True
if changed:
    json.dump(s, open('$FCUK_DIR/release-state.json','w'), indent=2)
    print('Added fix_rotation/ux_rotation to state file')
else:
    print('State file already has fix_rotation/ux_rotation')
"

# 6. Verify scripts
echo ""
echo "=== Verification ==="
bash -n "$FCUK_DIR/multi-branch-release.sh" && echo "  multi-branch-release.sh: bash syntax OK"
python3 -c "import py_compile; py_compile.compile('$FCUK_DIR/intelligence.py', doraise=True)" && echo "  intelligence.py: Python syntax OK"
bash -n "$AGENT_DIR/heartbeat.sh" && echo "  heartbeat.sh: bash syntax OK"

echo ""
echo "=== Deploy complete ==="
echo "Next cron run will use the new agent-aware system."
echo "To test immediately, restart the flywheel service or run:"
echo "  bash $FCUK_DIR/multi-branch-release.sh"
