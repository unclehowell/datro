---
id: search-strategy-discovery
name: Search Strategy for Pre-Configured Services
version: "1.0.0"
description: When user claims something is "already configured" - search strategy to find it efficiently
category: search-methodology
author: Hermes
created: 2026-04-10
---

# Search Strategy: Finding Pre-Configured Services

## The Problem
When a user says something is "already configured" or "already set up", I previously failed to find it by searching in complex subsystems first (logs, skills, config files) instead of checking obvious places.

## Failure Case: Resend Email Discovery
- User asked to send bulk emails, said email was "already configured"
- Failed twice before finding `.env.resend` at `/home/ubuntu/`
- Searched: Hermes config, system mail logs, PM2 logs, skills directory, gateway logs
- Missed: Simple directory listing at user home level

## Root Cause
1. Looked in complex places first instead of obvious ones
2. Didn't consider hidden files starting with `.` at root level
3. Didn't trust user assertion that config exists

## Updated Search Strategy

### When User Says "Already Configured" / "Already Set Up"

1. **Start Simple - Always**
   ```bash
   ls -la ~              # List all files including hidden
   ls -la ~/.* 2>/dev/null | head -20  # Show hidden config files
   find ~ -maxdepth 2 -name "*.env*"  # Find .env files at top level
   ```

2. **Pattern Recognition**
   - Hidden config files: `.env.*`, `.config/`, `.npmrc`, `.gitconfig`
   - Location: Usually at `~/` level, not deep subdirectories
   - Extensions: `.env`, `.conf`, `.config`, `.rc`

3. **Only After Simple Search Fails**
   - Check subsystem configs (hermes, pm2, systemctl)
   - Search logs for the service name
   - Look for related scripts in `~/bin/` or `~/scripts/`

## Key Rule
> Trust the user: if they say it exists, it's likely in an obvious place I should check first.

## Applied To
- Pre-configured API keys (`.env.*`)
- Email services (Resend, SMTP, etc.)
- Cloud services (AWS, Cloudflare, etc.)
- Any "already configured" service lookup
- Finding credentials or setup files

## Related Files
- `/home/ubuntu/datro/static/llmwiki/failure_learning.md`