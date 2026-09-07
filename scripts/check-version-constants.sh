#!/usr/bin/env bash
# WS-13 (v1.11.35): merge-gate lint — the CURRENT release version literal may
# only live in `.version` (plus markdown changelog/docs). Code/config that
# hardcodes it drifts on the next bump and becomes a lie about which release
# ships; installers resolve it at install time (WS-06).
#
# Matching is against the exact current version (read from .version), not a
# whole version series, so vendored third-party bundles (jQuery 1.x, tidiochat,
# npm lockfiles) never false-positive.
set -euo pipefail

if [[ ! -d .git ]]; then
  echo "check-version-constants: run from the repo root (uses git ls-files)." >&2
  exit 2
fi

if [[ ! -f .version ]]; then
  echo "check-version-constants: .version missing at repo root." >&2
  exit 2
fi

RELEASE_VERSION="$(tr -d '[:space:]' < .version)"
case "$RELEASE_VERSION" in
  1.*.*) ;;
  *)
    echo "check-version-constants: .version \"$RELEASE_VERSION\" does not look like a 1.x.y release." >&2
    exit 2
    ;;
esac

# Escape dots for a fixed-string regex ('1.11.34' -> '1\.11\.34').
pattern="$(printf '%s' "$RELEASE_VERSION" | sed 's/\./\\./g')"
violations=0

matches="$(git grep -nE "$pattern" \
  ':!*.md' ':!*.mdx' ':!.version' \
  ':!static/**' ':!public/ui/**' \
  ':!**/*.mp4' ':!**/*.png' ':!**/*.jpg' ':!**/*.webp' \
  ':!agentos/gui/remotion/out/**' \
  ':!agentos/gui/.next/**' \
  2>/dev/null || true)"

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  case "$line" in
    *"git grep"*) continue ;;
  esac
  file="${line%%:*}"; rest="${line#*:}"; lineno="${rest%%:*}"; content="${rest#*:}"
  # Explicit marker: a genuine runtime use (historical filename migration etc.)
  # can opt out. Document WHY when using it.
  [[ "$content" == *RELEASE-LITERAL-OK* ]] && continue
  # Skip comment lines: `#`, `//`, `/*`, `*`, `{/*`, `<!--`.
  first="$(printf '%s' "$content" | sed -e 's/^[[:space:]]*//')"
  case "$first" in
    '#'*|'//'*|'/'*'*'*|'*'*|'{/*'*|'<'*'--'*) continue ;;
  esac
  echo "HARDCODED VERSION: $file:$lineno: ${content:0:160}"
  violations=$((violations + 1))
done <<< "$matches"

if (( violations > 0 )); then
  echo "check-version-constants: FAIL — $violations occurrence(s) of the current release"
  echo "version ($RELEASE_VERSION) outside .version/docs. Resolve it at runtime (WS-06),"
  echo "move it into a .md doc, or add the RELEASE-LITERAL-OK marker with a reason."
  exit 1
fi

echo "check-version-constants: OK — no \"$RELEASE_VERSION\" literal outside .version / docs."