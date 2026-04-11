---
name: hermes-gateway-troubleshooting
description: Diagnose and fix Hermes gateway issues -- lock conflicts, stale PIDs, telegram 401 errors, config loading, and multi-gateway coexistence.
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [gateway, troubleshooting, telegram, lock-files, multi-instance]
    related_skills: [hermes-agent, telegram-fleet-roll-call]
---

# Hermes Gateway Troubleshooting

## Quick Diagnostic

```bash
# 1. Check running gateway processes
pgrep -af 'hermes gateway run' | grep -v HERMES_FENCE

# 2. Check gateway state
cat ~/.hermes/gateway_state.json | python3 -m json.tool

# 3. Check recent logs
tail -30 ~/.hermes/logs/gateway.log
```

## Problem: Telegram "401" or "Another gateway is already using this token"

This is **NOT** an authentication failure. The token is valid. It's a **scoped lock conflict** between multiple gateway instances using the same bot token.

### Root Causes

1. **Scoped lock conflict** — Hermes uses file-based locks to prevent multiple gateways from polling the same Telegram bot simultaneously.
2. **Env var override** — `TELEGRAM_BOT_TOKEN` set in env (systemd `.service` file, `gateway.env`, or `~/.hermes/.env`) **overrides** `enabled: false` in `config.yaml`. The gateway reads the env var and connects regardless of the config setting.
3. **Systemd service file** — The `/etc/systemd/system/hermes-gateway.service` may hardcode `Environment=TELEGRAM_BOT_TOKEN=...`. This takes priority over ALL config.yaml settings. You MUST remove it from the service file if you want to disable Telegram on the default agent.
4. **Per-session gateway spawning** — Each new CLI session can spawn its own gateway process, which conflicts with systemd-managed gateways.

### Lock File Location

```
~/.local/state/hermes/gateway-locks/
```

Format: `{scope}-{sha256_hash_first_16_chars}.lock`

Scopes: `telegram-bot-token`, `whatsapp-session`

### Systematic Resolution

**Step 1: Check for systemd service file token overrides**

This is the #1 missed cause. The systemd service may be injecting the token at the OS level:

```bash
grep TELEGRAM_BOT_TOKEN /etc/systemd/system/hermes-gateway.service
```

If found, it overrides everything (config.yaml `enabled: false`, token removal from .env, etc.). Remove it:

```bash
sudo sed -i '/TELEGRAM_BOT_TOKEN=/d' /etc/systemd/system/hermes-gateway.service
sudo systemctl daemon-reload
sudo systemctl start hermes-gateway
```

For per-agent services (hermes-cmd-agent1-4), check each: `/etc/systemd/system/hermes-cmd-agent*.service`

**Step 2: Check for env var overrides**

The gateway reads `TELEGRAM_BOT_TOKEN` from the **environment** first, which overrides `config.yaml`. Sources in load order:

1. systemd `Environment=` directives (highest priority)
2. `~/.hermes/gateway.env` (sourced by `gateway-run.sh`)
3. `~/.hermes/.env` (not sourced by bashrc — agents must source explicitly)

Check all sources:
```bash
env | grep TELEGRAM_BOT_TOKEN
grep TELEGRAM_BOT_TOKEN ~/.hermes/gateway.env ~/.hermes/.env
```

If an agent shouldn't use Telegram, remove the token from ALL of these.

**Step 3: Remove the telegram platform section entirely**

If `enabled: false` doesn't work (gateway still connects), remove the entire `telegram` key from `platforms:` in config.yaml AND remove the token from env files:

```python
import yaml
with open('config.yaml') as f:
    cfg = yaml.safe_load(f)
if 'telegram' in cfg.get('platforms', {}):
    del cfg['platforms']['telegram']
with open('config.yaml', 'w') as f:
    yaml.dump(cfg, f)
```

**Step 4: Use systemd instead of manual gateway spawning**

This system uses systemd for gateway management. Manual `hermes gateway run` spawns conflict with systemd services:

```bash
# Check service status
systemctl status hermes-gateway hermes-cmd-agent{1,2,3,4} --no-pager | grep -E 'Loaded|Active'

# Stop all, clean, restart
sudo systemctl stop hermes-gateway hermes-cmd-agent{1,2,3,4}
rm -f ~/.local/state/hermes/gateway-locks/*.lock
sudo systemctl start hermes-cmd-agent{1,2,3,4}
```

Only start the default agent via systemd if Telegram is enabled for it.

**Step 1: Identify all running gateways**

```bash
pgrep -af 'hermes gateway run' | grep -v HERMES_FENCE
```

Each line is a separate gateway instance. Each should have a **unique token**.

**Step 2: Check lock files for stale PIDs**

```python
import os, json

lock_dir = os.path.expanduser("~/.local/state/hermes/gateway-locks")
for f in os.listdir(lock_dir):
    path = os.path.join(lock_dir, f)
    with open(path) as fh:
        data = json.load(fh)
    pid = data.get('pid', '?')
    try:
        os.kill(int(pid), 0)
        status = 'ALIVE'
    except:
        status = 'STALE'
    print(f"{f}: PID {pid} ({status})")
    if status == 'STALE':
        os.remove(path)
        print(f"  Removed stale lock")
```

**Step 3: Kill conflicting gateways**

Kill all gateways, then start only ONE per unique token:

```bash
# Kill all gateway processes
pkill -9 -f 'hermes gateway run'
sleep 2

# Remove stale state
rm -f ~/.hermes/gateway_state.json

# Clean stale locks (python script above)

# Start gateway for the default agent
cd /home/ubuntu/.hermes/hermes-agent && bash ~/.hermes/gateway-run.sh &
```

**Step 4: Verify unique tokens across agents**

```python
import yaml, hashlib, os, glob

agents = {
    'default': '/home/ubuntu/.hermes/config.yaml',
    'cmd1': '/home/ubuntu/hermes_cmd_agent1/config.yaml',
    'cmd2': '/home/ubuntu/hermes_cmd_agent2/config.yaml',
    'cmd3': '/home/ubuntu/hermes_cmd_agent3/config.yaml',
    'cmd4': '/home/ubuntu/hermes_cmd_agent4/config.yaml',
}

for name, path in agents.items():
    if os.path.exists(path):
        with open(path) as f:
            cfg = yaml.safe_load(f)
        token = cfg.get('platforms', {}).get('telegram', {}).get('token', '')
        h = hashlib.sha256(token.encode()).hexdigest()[:16] if token else 'none'
        print(f"{name}: hash={h}, present={bool(token)}")
```

If two agents share the same token hash, one must have its Telegram disabled:

```yaml
platforms:
  telegram:
    enabled: false
```

**IMPORTANT:** `enabled: false` in config.yaml is checked at line 1118 of `gateway/run.py`:
```python
if not platform_config.enabled:
    continue
```
If it doesn't work, you may need to restart the gateway process for the config to take effect.

## Problem: OPENAI_API_KEY not found by opencode

Openencode reads from shell environment, not from `~/.hermes/.env`.

The `.bashrc` sources `~/.hermes/gateway.env` (NOT `.env`). So API keys must be in `gateway.env`:

```bash
# In ~/.hermes/gateway.env
OPENAI_API_KEY=sk-proj-xxx
```

Verify: `source ~/.hermes/gateway.env && echo $OPENAI_API_KEY`

## Problem: WhatsApp lock conflict

Same mechanism as Telegram. Lock file: `whatsapp-session-{hash}.lock`

Resolution: Same as Telegram lock cleanup above. Remove stale lock, ensure only one gateway claims the session.

## Problem: Gateway connects to Telegram but gets polling conflict

This means TWO gateways are successfully acquiring the lock (or the lock was removed between them). Only ONE gateway process can poll a given bot token at a time.

Fix:
1. Identify which gateways share the same token hash
2. Keep only ONE gateway per unique token
3. Disable Telegram on the others
4. Restart the disabled agents' gateways

## Multi-Agent Architecture

On this system, each "agent" is an independent gateway:
- **Default** (`~/.hermes/`): Primary gateway
- **cmd_agent1-4** (`~/hermes_cmd_N/`): 4 command agents, each with own `HERMES_HOME`, config, logs, and tokens

Each needs its own Telegram bot token. If they share tokens, they'll conflict.

To disable Telegram on an agent while keeping webhook/whatsapp:

```yaml
platforms:
  telegram:
    enabled: false
```

## Problem: Tool call spam on WhatsApp/Telegram

By default, Hermes forwards every tool call execution as a progress message to messaging platforms (WhatsApp, Telegram). These look like:
- "🐍 execute_code: \"from hermes_tools import...\""
- "🔧 terminal: grep -rn tool_call..."

This triggers **WhatsApp spam detection** (getting blocked) and **Telegram rate limiting** (throttled).

### Fix: Disable tool progress on all agents

```yaml
# In each agent's config.yaml
display:
  tool_progress: "off"          # Disable tool call forwarding to platforms
  tool_progress_command: false  # Disable /verbose command
```

The default is `"all"` which sends every tool call. Valid values:
- `"off"` — nothing sent (recommended for production)
- `"new"` — only shown when tool changes
- `"all"` — every tool call (default, dangerous for WhatsApp)
- `"verbose"` — every tool call with full arguments

**Apply to all agents:** The setting must be in EACH agent's config.yaml (`~/.hermes/config.yaml` AND `~/hermes_cmd_agentN/config.yaml`). Setting it on the default agent alone won't affect the cmd agents.

**Verify after applying:** Restart the gateway, then check that no emoji-prefixed tool messages appear on WhatsApp/Telegram. Only final plain text responses should be sent.

### Code reference
- `gateway/run.py:6218-6229` — reads `display.tool_progress`, defaults to `"all"`
- `gateway/run.py:6229` — `tool_progress_enabled = progress_mode != "off" and source.platform != Platform.WEBHOOK`
- When `"off"`, `progress_queue=None` and `progress_callback` is a no-op
- Webhook platform is ALWAYS excluded (line 6229)

## Port Conflicts

- Webhook port 8644: Used by default gateway
- If `port already in use` error: `sudo fuser -k 8644/tcp`

## Config Changes Not Taking Effect

The gateway reads config at startup. If you change `config.yaml`:
1. Kill the gateway: `pkill -f 'hermes gateway run'`
2. Clear state: `rm ~/.hermes/gateway_state.json`
3. Restart: `bash ~/.hermes/gateway-run.sh &`

## Pitfalls

- **Every new session can spawn a gateway** -- this causes infinite lock ping-pong. Always kill existing gateways before starting a new one.
- **Token truncation in config** -- `.env` values sometimes show as `***` in terminal but the actual file has the real key. Verify with `python3 -c "print(open('file').read())"`.
- **Stale PIDs in gateway_state.json** -- causes the gateway to think it's still running when it's not. Remove the file to reset.
- **Lock files on disk** -- survive process death. Always clean stale locks when resolving conflicts.
- **YAML `enabled: false` must be boolean** -- `'false'` (string) is truthy. Must be `false` (boolean).