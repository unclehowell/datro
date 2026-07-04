# Production-Ready FCUK Proxy Rerelease Plan

## Goal
Make `curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash` work reliably on Linux, Termux/Android, and other devices with proper loop prevention and agentic routing.

## Issues to Fix from Current Implementation

### 1. Termux Installation Failures
- `pkg install nodejs npm` may fail — Termux may only have `nodejs` package
- `md5sum | head -c 32` format inconsistent on Android
- `nohup` doesn't persist on Android reboot
- Missing `termux-wake-lock` to prevent CPU sleep

### 2. Child Proxy Logic Gaps  
- Version stuck at `0.4.0` in child-proxy.mjs (should be `0.5.0`)
- AGENT_ROLE read but not used in registration payload
- Missing X-Agentic header forwarding from client to parent
- No exponential backoff on retries

### 3. Parent Proxy Endpoint Issues
- No TTL cleanup for dead nodes in KV
- No validation of API keys before use
- No rate limiting on registration/heartbeat

## Implementation Steps
1. Fix Termux package detection and background service handling
2. Update child-proxy.mjs to v0.5.0 with proper header routing
3. Add node TTL cleanup to flywheel worker
4. Create Android-specific documentation
