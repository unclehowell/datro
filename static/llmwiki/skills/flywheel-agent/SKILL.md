# Flywheel Agent - Self-Improving Autonomous System

## Overview

The flywheel is an autonomous agent that continuously improves the datro monorepo using LLMs. It runs every 6 hours via cron, scanning for issues and applying fixes through intelligent LLM-powered analysis.

## Architecture

```
cron (every 15 min) → datro-unified-sync.sh → Flywheel (every 6 hours)
                                                      ↓
                                              Hermes Agent (LLM)
                                                      ↓
                                              Issue Scanner → Fixer → Validator
```

## LLM Configuration

### Primary: Hermes Agent
The flywheel uses Hermes as its LLM for intelligent analysis and fixing.

**Config location**: `~/.hermes/config.yaml`

```yaml
model:
  default: Qwen/Qwen3-8B
  provider: opencode-zen

fallback_providers:
  - provider: opencode-zen
    model: Qwen/Qwen3-8B
  - provider: openrouter
    model: google/gemma-4-26b-a4b-it:free
  - provider: groq
    model: llama-3.3-70b-versatile
  - provider: groq
    model: mixtral-8x7b-32768
  - provider: openrouter
    model: qwen/qwen3.6-plus-preview:free
```

### Fallback Chain

If primary LLM fails:
1. **OpenCode Zen** (Qwen/Qwen3-8B) - Primary
2. **OpenRouter** (google/gemma-4-26b-a4b-it:free) - Fallback #1
3. **Groq** (llama-3.3-70b-versatile) - Fallback #2
4. **Groq** (mixtral-8x7b-32768) - Fallback #3
5. **OpenRouter** (qwen/qwen3.6-plus-preview:free) - Fallback #4

## Health Check (Pre-Flight)

Before each flywheel cycle, the agent MUST verify:

### 1. LLM Health
```bash
# Check each provider in fallback chain
hermes model list
hermes model test opencode-zen
hermes model test openrouter
hermes model test groq
```

**Criteria**:
- API responds without error
- Quota remaining > 10%
- Response time < 10 seconds

### 2. System Health
```bash
# Check disk space
df -h /home/ubuntu

# Check memory
free -h

# Check if git is working
git status

# Check internet connectivity
curl -s --max-time 5 https://github.com > /dev/null && echo "OK"
```

### 3. Package Updates
```bash
# Check for system updates
apt update -qq && apt list --upgradable 2>/dev/null | wc -l

# Check Python packages needing update
pip list --outdated | wc -l
```

### 4. Repo Health
```bash
# Check for uncommitted changes
git status --short

# Check remote is reachable
git ls-remote --heads origin gh-pages
```

## Health Check Output

If any check fails, log to `~/logs/flywheel-health.log` and either:
- Fix immediately if possible
- Skip cycle and notify
- Escalate if critical

## Flywheel Mission

See `FLYWHEEL_MISSION.md` for core principles:

1. **Always-On Websites** - All sites online 24/7, auto-detect downtime
2. **Security First** - Fix vulnerabilities, defer broken features to .gitignore
3. **Code Quality** - No spelling/grammar errors, no console errors
4. **Continuous Improvement** - Severity-based prioritization

## Severity Rankings

| Level | Issue Type | Action |
|-------|------------|--------|
| 8-10 | Security vulnerabilities | Fix immediately |
| 7 | Broken functionality | Fix within 1 cycle |
| 5-6 | Code quality issues | Fix when time permits |
| 1-4 | Minor improvements | Nice to have |

## What Flywheel Monitors

- `static/*/index.html` - All web properties
- `static/*/*.html` - All HTML files  
- `static/*/assets/*` - All assets load correctly
- Security: XSS, injection, exposed secrets
- Browser: console errors, broken scripts
- Content: spelling, grammar, broken links

## Safety Protocols

- NEVER pushes directly to `gh-pages`
- Creates branches: `auto/fix-<issue-type>-<id>`
- Aborts if tests/validation fail
- Skips `.env`, secrets, credentials
- Max 10 file edits per cycle

## Troubleshooting

### LLM Not Responding
1. Check `hermes model` - list available models
2. Test each fallback: `hermes -p <provider> chat`
3. Check API keys in `~/.hermes/config.yaml`
4. Verify network: `curl -s https://api.opencode.ai/zen/v1`

### No Issues Found
- This is OK - means repo is healthy
- Flywheel still runs to check for regressions

### Cycle Failed
- Check `~/logs/flywheel.log` for errors
- Run manually: `python3 agent/main.py --once`
- Verify cron: `crontab -l | grep flywheel`