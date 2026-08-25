#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# flywheel.sh — Automated color theme generator
# ═══════════════════════════════════════════════════════════════════════════════
#
# Generates a new color theme every 20 minutes for 18 iterations.
# Each iteration:
#   1. Picks the next theme from scripts/themes.json
#   2. Appends dark + light CSS variable blocks to globals.css
#   3. Updates ThemeProvider.tsx with the new theme name
#   4. Bumps .version + all installer VERSION strings
#   5. Commits, pushes, and creates a GitHub release
#
# Usage:
#   bash scripts/flywheel.sh
#
# State is tracked in ~/.fcukproxy/flywheel-state
# ═══════════════════════════════════════════════════════════════════════════════

REPO="unclehowell/datro"
BRANCH="financecheque"
DATRO_DIR="${DATRO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_FILE="$HOME/.fcukproxy/flywheel-state"
THEMES_JSON="$DATRO_DIR/scripts/themes.json"
LOG_FILE="$HOME/.fcukproxy/logs/flywheel.log"
MAX_ITERATIONS=18

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_FILE"
}

# ── Read current iteration ──
ITERATION=0
[[ -f "$STATE_FILE" ]] && ITERATION=$(cat "$STATE_FILE" 2>/dev/null || echo 0)

if [[ "$ITERATION" -ge "$MAX_ITERATIONS" ]]; then
  log "Flywheel complete ($MAX_ITERATIONS iterations). Nothing to do."
  exit 0
fi

ITERATION=$((ITERATION + 1))
echo "$ITERATION" > "$STATE_FILE"

log "=== Flywheel iteration $ITERATION/$MAX_ITERATIONS ==="

# ── Pick theme from themes.json ──
THEME_NAME=$(python3 -c "
import json, sys
with open('$THEMES_JSON') as f:
    themes = json.load(f)
idx = ($ITERATION - 1) % len(themes)
print(themes[idx]['name'])
")

log "Theme: $THEME_NAME"

# ── Compute new version ──
# v1.7.5 through v1.7.22
NEW_VERSION="1.7.$((4 + ITERATION))"
OLD_VERSION=$(cat "$DATRO_DIR/.version" 2>/dev/null | tr -d '[:space:]')
log "Version: v$OLD_VERSION → v$NEW_VERSION"

# ── Generate CSS blocks and append to globals.css ──
python3 -c "
import json

with open('$THEMES_JSON') as f:
    themes = json.load(f)

idx = ($ITERATION - 1) % len(themes)
theme = themes[idx]
name = theme['name']

def css_block(dark_vars, selector_suffix=''):
    prefix = f'[data-theme=\"{name}{selector_suffix}\"]'
    lines = [f'{prefix} {{']
    for k, v in dark_vars.items():
        lines.append(f'  --{k}: {v};')
    lines.append('}')
    return '\n'.join(lines)

dark_css = css_block(theme['dark'])
light_css = css_block(theme['light'], '-light')

globals_path = '$DATRO_DIR/agentos/gui/src/app/globals.css'
with open(globals_path, 'r') as f:
    content = f.read()

# Append new theme blocks before the @theme inline block
marker = '@theme inline'
insert_point = content.find(marker)
if insert_point == -1:
    insert_point = len(content)

new_blocks = f'\n{dark_css}\n\n{light_css}\n\n'
content = content[:insert_point] + new_blocks + content[insert_point:]

with open(globals_path, 'w') as f:
    f.write(content)

print(f'Appended {name} + {name}-light to globals.css')
"

# ── Update ThemeProvider.tsx with new theme name ──
ThemeProvider="$DATRO_DIR/agentos/gui/src/components/ThemeProvider.tsx"
# Add new themes before the closing ] of THEMES array
python3 -c "
import re
with open('$ThemeProvider', 'r') as f:
    content = f.read()

name = '$THEME_NAME'
# Add dark and light variants to the THEMES array
new_entries = f'  \"{name}\", \"{name}-light\",'
# Insert before the closing ] of the THEMES array
content = content.replace(
    '] as const;',
    f'  {new_entries}\n] as const;'
)
with open('$ThemeProvider', 'w') as f:
    f.write(content)
print(f'Added {name} to THEMES array')
"

# ── Bump versions ──
echo "$NEW_VERSION" > "$DATRO_DIR/.version"

sed -i "s/^VERSION=.*/VERSION=\"$NEW_VERSION\"/" "$DATRO_DIR/install.sh"
sed -i "s/^VERSION=.*/VERSION=\"$NEW_VERSION\"/" "$DATRO_DIR/public/fcukproxy/install.sh"
sed -i "s/^VERSION=.*/VERSION=\"$NEW_VERSION\"/" "$DATRO_DIR/public/install.sh"

# ── Prepend CHANGELOG ──
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M)
sed -i "1i\\## [$NEW_VERSION] - $TIMESTAMP\\n\\nAutomated flywheel iteration $ITERATION/$MAX_ITERATIONS: new color theme \`$THEME_NAME\`.\\n" "$DATRO_DIR/CHANGELOG.md"

# ── Git commit + push + release ──
cd "$DATRO_DIR"
git add -A
git -c user.name="unclehowell" -c user.email="unclehowell@users.noreply.github.com" \
  commit -m "v$NEW_VERSION: flywheel theme $ITERATION/$MAX_ITERATIONS — $THEME_NAME" 2>>"$LOG_FILE"
git push origin "$BRANCH" 2>>"$LOG_FILE"

# Create GitHub release
gh release create "financecheque-v$NEW_VERSION" \
  --repo "$REPO" --target "$BRANCH" \
  --title "v$NEW_VERSION: theme $THEME_NAME" \
  --notes "Automated flywheel iteration $ITERATION/$MAX_ITERATIONS: new color theme \`$THEME_NAME\`." \
  2>>"$LOG_FILE" || log "WARN: gh release create failed (may need auth)"

log "=== Flywheel iteration $ITERATION complete: v$NEW_VERSION ($THEME_NAME) ==="
