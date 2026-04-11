---
name: hermes-telegram-fix
description: Fix Telegram 401/lock conflicts across Hermes multi-agent gateway deployments. Covers the root cause of "Another local Hermes gateway is already using this Telegram bot token" errors when running multiple agents on one machine.
version: 1.0.0
---

# Hermes Telegram Lock Conflict Fix

## Problem
Multiple Hermes gateway agents on the same machine produce lock conflicts:
- "Another local Hermes gateway is already using this Telegram bot token (PID XXXXX)"
- "Telegram status fatal" despite valid bot tokens
- WhatsApp also affected with same pattern

## Root Causes (5 found)

### 1. Systemd service hardcodes TELEGRAM_BOT_TOKEN
The default agent's systemd unit (`/etc/systemd/system/hermes-gateway.service`) has:
```ini
Environment=TELEGRAM_BOT_TOKEN=874682...
```
This env var **overrides** config.yaml's `platforms.telegram.enabled=false`. The gateway reads env first, always connects to Telegram, and steals the lock from cmd agents.

### 2. Multiple concurrent gateway processes
Every new session turn can spawn `hermes gateway run`, stacking processes that all try to poll the same bot token. Telegram only allows one polling connection per token.

### 3. Stale lock files at ~/.local/state/hermes/gateway-locks/
Lock files persist after gateway crashes. They reference dead PIDs.

### 4. Stale gateway_state.json
Contains old PIDs and fatal error states that mislead new agents.

### 5. gateway-run.sh sources same gateway.env for all agents
All agents inherit same TELEGRAM_BOT_TOKEN from default gateway.env.

## Fix Procedure

### Step 1: Remove TELEGRAM_BOT_TOKEN from default systemd service
```bash
sudo sed -i '/TELEGRAM_BOT_TOKEN=/d' /etc/systemd/system/hermes-gateway.service
sudo systemctl daemon-reload
```

### Step 2: Disable telegram on default agent
```bash
# Remove telegram from config.yaml platforms section
# Or set enabled: false with empty token
python3 -c "
import yaml
with open('/home/ubuntu/.hermes/config.yaml') as f:
    cfg = yaml.safe_load(f)
if 'telegram' in cfg.get('platforms', {}):
    cfg['platforms']['telegram']['enabled'] = False
    cfg['platforms']['telegram']['token'] = ''
with open('/home/ubuntu/.hermes/config.yaml', 'w') as f:
    yaml.dump(cfg, f, default_flow_style=False)
"
```

### Step 3: Kill ALL gateways and clean state
```bash
# Kill everything
pkill -9 -f 'hermes gateway run'

# Remove ALL lock files
rm -f ~/.local/state/hermes/gateway-locks/*.lock

# Remove ALL gateway_state.json
rm -f ~/.hermes/gateway_state.json
rm -f ~/hermes_cmd_agent*/gateway_state.json
```

### Step 4: Restart services
```bash
for svc in hermes-gateway hermes-cmd-agent1 hermes-cmd-agent2 hermes-cmd-agent3 hermes-cmd-agent4; do
    sudo systemctl restart $svc
done
```

## Verification
```bash
# Should show 5 processes, no conflicts
systemctl is-active hermes-gateway hermes-cmd-agent{1,2,3,4}
cat ~/.local/state/hermes/gateway-locks/*.lock | python3 -c "
import json, sys, os
for line in sys.stdin:
    try:
        d=json.loads(line)
        pid=d.get('pid',0)
        os.kill(pid,0)
        print(f'PID {pid}: ALIVE')
    except:
        print(f'PID {pid}: STALE')
    except (KeyboardInterrupt, StopIteration):
        pass
"
```

## Architecture Reference
- Default agent: ~/.hermes/ (should NOT poll Telegram - cmd agents handle it)
- Cmd agents: ~/hermes_cmd_agent{1-4}/ (each has unique Telegram bot token)
- Each cmd agent needs its own gateway-run.sh sourcing its own .env
- Lock files: ~/.local/state/hermes/gateway-locks/telegram-bot-token-{hash}.lock

## Pitfalls
- Setting `enabled: false` in config.yaml does NOT work if TELEGRAM_BOT_TOKEN is in the systemd service env or gateway.env
- The gateway reads platform config via `PlatformConfig` which has `get_env_value()` override for TELEGRAM_BOT_TOKEN
- Always use `sudo sed` to edit systemd files (not python without sudo)
- Lock files use `{scope}-{identity_hash}.lock` naming - check actual hash matches
