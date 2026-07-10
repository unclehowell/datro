#!/usr/bin/env bash
# === Hermes Trigger: Complete MiniCPM Cognitive Core Setup ===
# Placed in ~/.hermes/cron/ by handoff. Hermes: read this file and complete the tasks.
# 
# INSTRUCTIONS FOR HERMES:
# This is triggered because opencode's session is ending / running low on tokens.
# You must complete the remaining work on both laptop and phone.

TASKS=(
  "1. Install llama-server systemd service"
  "2. Refactor agent.py to use MiniCPM cognitive core with tool-use routing"
  "3. Wire Honcho/Mem0 as memory tools for cognitive core"
  "4. Bump .version to 0.5.0.06, commit, tag, push to GitHub"
  "5. Check phone via ADB for llama-server + phone-proxy status"
  "6. Verify cognitive core works on both devices"
)

echo "=== REMAINING WORK ==="
for task in "${TASKS[@]}"; do
  echo "$task"
done
echo ""
echo "Full handoff doc at /tmp/hermes-handoff-laptop.md"
echo "Phone task doc at /sdcard/Download/HERMES_TASK.md (push via ADB)"
echo "Agent.py to refactor: /home/unclehowell/datro/public/fcukproxy/agent.py"
echo "Phone proxy ref: /home/unclehowell/datro/phone-proxy.go (already done on phone)"
echo ""
echo "=== MODEL STATUS ==="
echo "Laptop: llama-server running on :8090 (PID $(pgrep -f 'llama-server.*MiniCPM' | head -1))"
echo "Phone:  llama-server running on :8090 (check via 'adb shell ps | grep llama')"
echo ""
echo "=== CURRENT VERSION ==="
cat /home/unclehowell/datro/.version 2>/dev/null || echo "0.5.0.05"
