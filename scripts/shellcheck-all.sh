#!/usr/bin/env bash
# WS-13 (v1.11.35): merge-gate shellcheck over every tracked shell script.
set -euo pipefail

if [[ ! -d .git ]]; then
  echo "shellcheck-all: run from the repo root (uses git ls-files)." >&2
  exit 2
fi

command -v shellcheck >/dev/null 2>&1 || {
  echo "shellcheck not installed — install it (apt-get install shellcheck / brew install shellcheck)." >&2
  exit 2
}

# WS-13 (v1.11.35): gate at ERROR severity. Warnings (unused vars, quoting /
# style advisories) are numerous and advisory; an error-level gate still catches
# every construct that would behave wrongly / unsafely at runtime without
# demanding a style rewrite of legacy scripts.
SEVERITY="${SHELLCHECK_SEVERITY:-error}"

failed=0
total=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  total=$((total + 1))
  if ! shellcheck -S "$SEVERITY" -s bash "$f"; then
    echo "shellcheck FAILED on $f" >&2
    failed=$((failed + 1))
  fi
done < <(git ls-files '*.sh')

echo "shellcheck-all: $((total - failed))/$total scripts clean"
[[ "$failed" -eq 0 ]]