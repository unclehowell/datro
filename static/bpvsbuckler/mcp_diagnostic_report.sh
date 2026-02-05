#!/usr/bin/env bash
set -euo pipefail

OUT="mcp_diagnostic_report_$(date +%Y%m%d_%H%M%S).txt"

echo "DATRO MCP DIAGNOSTIC REPORT" > "$OUT"
echo "Generated: $(date -Is)" >> "$OUT"
echo "Host: $(hostname)" >> "$OUT"
echo >> "$OUT"

echo "=== AIDER VERSION ===" >> "$OUT"
aider --version >> "$OUT" 2>&1 || echo "aider not found" >> "$OUT"
echo >> "$OUT"

echo "=== PYTHON ===" >> "$OUT"
python3 --version >> "$OUT" 2>&1 || true
pip show aider-chat >> "$OUT" 2>&1 || true
pip show litellm >> "$OUT" 2>&1 || true
echo >> "$OUT"

echo "=== GIT CONTEXT ===" >> "$OUT"
git rev-parse --show-toplevel >> "$OUT" 2>&1 || true
git status --short >> "$OUT"
echo >> "$OUT"

echo "=== AIDER CONFIG FILES FOUND ===" >> "$OUT"
find ~ -name ".aider.conf.yml" -o -name ".aiderignore" 2>/dev/null >> "$OUT"
echo >> "$OUT"

echo "=== ROOT .aider.conf.yml ===" >> "$OUT"
cat ../../.aider.conf.yml 2>/dev/null >> "$OUT" || echo "NOT FOUND" >> "$OUT"
echo >> "$OUT"

echo "=== ROOT .aiderignore ===" >> "$OUT"
cat ../../.aiderignore 2>/dev/null >> "$OUT" || echo "NOT FOUND" >> "$OUT"
echo >> "$OUT"

echo "=== FILE SIZES (TARGET FILES) ===" >> "$OUT"
wc -c initialData.ts puck.config.tsx >> "$OUT"
echo >> "$OUT"

echo "=== GREP FOR REMOTE URLS ===" >> "$OUT"
grep -R "http://" -n initialData.ts puck.config.tsx || true >> "$OUT"
grep -R "https://" -n initialData.ts puck.config.tsx || true >> "$OUT"
echo >> "$OUT"

echo "=== ENVIRONMENT VARIABLES (SANITIZED) ===" >> "$OUT"
env | grep -E 'AIDER|OPENAI|LITELLM|AWS|GROQ|ROUTER' | sed 's/=.*/=REDACTED/' >> "$OUT"
echo >> "$OUT"

echo "=== AWS MCP ENDPOINT TEST (HEADERS ONLY) ===" >> "$OUT"
curl -I https://2wkrdq3g2e.execute-api.us-east-1.amazonaws.com/Prod/v1 2>&1 >> "$OUT"
echo >> "$OUT"

echo "=== LAMBDA PAYLOAD SIZE ESTIMATE ===" >> "$OUT"
python3 - <<'PYEOF' >> "$OUT"
import json, pathlib
files = ["initialData.ts", "puck.config.tsx"]
content = {}
for f in files:
    p = pathlib.Path(f)
    content[f] = p.read_text() if p.exists() else ""
payload = {
    "model": "gpt-4",
    "messages": [
        {"role": "system", "content": "test"},
        {"role": "user", "content": content}
    ]
}
data = json.dumps(payload).encode("utf-8")
print(f"Estimated raw JSON payload size: {len(data)/1024:.2f} KB")
PYEOF

echo >> "$OUT"
echo "=== DONE ===" >> "$OUT"

echo
echo "Diagnostic report written to:"
echo "  $OUT"
