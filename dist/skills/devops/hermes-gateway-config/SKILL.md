---
name: hermes-gateway-config
description: Configure and troubleshoot Hermes gateway — API keys, platform setup, environment variable sourcing, and process management. Use when setting up messaging platforms, fixing auth errors, or resolving gateway conflicts.
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [gateway, configuration, telegram, api-keys, troubleshooting]
---

# Hermes Gateway Configuration

## Config File Hierarchy

Hermes reads config from multiple files — **different components read different files**:

| File | Read By | Purpose |
|------|---------|---------|
| `~/.hermes/config.yaml` | Gateway, agent core | Platform configs, model settings, memory provider config |
| `~/.hermes/.env` | Gateway at startup | API keys and secrets (loaded internally by gateway) |
| `~/.hermes/gateway.env` | Shell sessions (via bashrc source) | Env vars available to ALL shell commands including opencode |
| `~/.hermes/honcho.json` | Honcho plugin (via `from_global_config()`) | Honcho API key and host config |
| `~/.hermes/honcho_api_key.env` | Shell sessions + gateway wrapper (when sourced) | Preferred place for `HONCHO_API_KEY` (avoid storing the key directly in `config.yaml`) |

CRITICAL: Shell commands (like opencode) source `~/.bashrc` which loads `gateway.env` (and may load `honcho_api_key.env` depending on your shell config), but NOT `~/.hermes/.env`. The `.env` file is typically read by the gateway process itself.

**Best practice for Honcho:** ensure the gateway startup wrapper (e.g. `~/.hermes/gateway-run.sh`) sources `~/.hermes/honcho_api_key.env` so `HONCHO_API_KEY` is present for the gateway process, and keep `honcho.api_key` out of `config.yaml`.

## Setting Up Messaging Platforms

### Telegram

1. Verify the bot token is valid:
```bash
python3 -c "
import urllib.request, json
token = '<BOT_TOKEN>'
resp = urllib.request.urlopen(f'https://api.telegram.org/bot{token}/getMe', timeout=5)
print(json.loads(resp.read()))
"
```

2. Add telegram to `~/.hermes/config.yaml`:
```yaml
platforms:
  telegram:
    enabled: true
    token: "<BOT_TOKEN>"
    allow_all: true  # or set allowed_users below
```

3. Set the token in both `.env` AND `gateway.env`:
```bash
# In ~/.hermes/.env (read by gateway directly)
TELEGRAM_BOT_TOKEN=<TOKEN>

# In ~/.hermes/gateway.env (sourced by bashrc for shell commands)
TELEGRAM_BOT_TOKEN=<TOKEN>
```

4. Set allow-all or allowlist:
```bash
# In ~/.hermes/.env
TELEGRAM_ALLOW_ALL_USERS=true
# OR
TELEGRAM_ALLOWED_USERS=5837518218
GATEWAY_ALLOW_ALL_USERS=true
```

### Common Error: "Another local Hermes gateway is already using this Telegram bot token"

This is **NOT a 401 auth error or Telegram API failure**. It means multiple gateway processes are running and competing for the same token via a scoped lock on disk.

#### How the Lock Mechanism Works

Lock files live at `~/.local/state/hermes/gateway-locks/` with naming pattern:
- `telegram-bot-token-{identity_hash}.lock` — one per unique bot token
- `whatsapp-session-{identity_hash}.lock` — one per unique session

Each lock file stores the PID of the gateway that owns it. When a new gateway starts, it:
1. Checks if a lock file exists for this token
2. If yes, tests if the PID is still alive via `os.kill(pid, 0)`
3. If the PID is alive → blocks with "Another gateway is already using this token"
4. If the PID is dead → removes stale lock and proceeds

#### Multi-Token Architecture

On this server, there are **5 agents** with **4 distinct Telegram tokens**:
| Agent | Token Owner | PID | Status |
|-------|------------|-----|--------|
| cmd_agent1 | Unique bot | 7514 | Connected |
| cmd_agent2 | Unique bot | 7511 | Connected |
| cmd_agent3 | Unique bot | 7508 | Connected |
| cmd_agent4 | Unique bot | 7512 | Connected |
| **default** | Same as cmd_agent1 | -- | **LOCK CONFLICT** |

The default agent shares its token with one of the cmd agents, causing the lock conflict.

#### Fix Options

**Option A: Disable Telegram on default agent** (recommended when cmd agents cover Telegram)
```python
import yaml
config_path = "~/.hermes/config.yaml"
cfg = yaml.safe_load(open(config_path))
cfg["platforms"]["telegram"]["disabled"] = True  # or remove the section entirely
yaml.dump(cfg, open(config_path, "w"), default_flow_style=False)
```

**Option B: Kill all and start fresh single gateway**
```bash
# 1. Kill ALL gateway processes (be careful not to kill the CLI session)
sudo kill -9 $(pgrep -f 'hermes gateway run')
sleep 3
# Verify all dead — pgrep should return "ALL DEAD"
pgrep -f 'hermes gateway run' || echo "ALL DEAD"

# 2. Clear stale lock files (PID-based staleness detection)
find ~/.local/state/hermes/gateway-locks/ -name '*.lock' -exec python3 -c "
import os, json, sys
for f in sys.argv[1:]:
    try:
        with open(f) as fh: data = json.load(fh)
        pid = int(data.get('pid', 0))
        alive = True
        try: os.kill(pid, 0)
        except: alive = False
        if not alive:
            os.remove(f)
            print(f'Removed stale lock: {os.path.basename(f)} (PID {pid})')
        else:
            print(f'Keeping active lock: {os.path.basename(f)} (PID {pid})')
    except Exception as e:
        print(f'Error with {f}: {e}')
" {} +

# 3. Clear webhook port if held
sudo fuser -k 8644/tcp 2>/dev/null

# 4. Start a SINGLE gateway instance
cd ~/.hermes/hermes-agent && bash ~/.hermes/gateway-run.sh > /tmp/gateway-start.log 2>&1 &

# 5. Verify clean startup
sleep 5
tail -20 /tmp/gateway-start.log
grep 'connected\\|failed' /home/ubuntu/.hermes/logs/gateway.log | tail -10
```

**Option C: Assign unique token to default agent** (gives it its own Telegram bot)
Get a new bot token from @BotFather, then update `~/.hermes/config.yaml`:
```yaml
platforms:
  telegram:
    enabled: true
    token: "NEW_BOT_TOKEN_HERE"
    allow_all: true
```

### WhatsApp

WhatsApp shows the same lock conflict if two gateways run. Same fix as above.

## Setting Up API Keys

### OpenAI (for opencode and agents)

The key must be in `gateway.env` so shell sessions can see it:
```bash
# Add to ~/.hermes/gateway.env
OPENAI_API_KEY=sk-proj-...

# Also in ~/.hermes/.env (for gateway's direct use)
OPENAI_API_KEY=sk-proj-...
```

After updating, new shell sessions will pick it up via bashrc sourcing.

### Honcho

Three files must have matching keys:
```bash
# 1. ~/.hermes/honcho.json
{"hosts": {"hermes": {...}}, "apiKey": "hch-v3-..."}

# 2. ~/.hermes/honcho_api_key.env
HONCHO_API_KEY=hch-v3-...

# 3. ~/.hermes/config.yaml
honcho:
  api_key: hch-v3-...
```

After updating keys, the gateway must be restarted.

## Gateway Process Management

### Start
```bash
cd ~/.hermes/hermes-agent && bash ~/.hermes/gateway-run.sh > /tmp/gateway-start.log 2>&1 &
```

### Stop
```bash
sudo kill -9 $(pgrep -f 'hermes gateway run')
# Verify
pgrep -f 'hermes gateway run' || echo "ALL DEAD"
```

### Check status
```bash
ps aux | grep '[h]ermes gateway run'
tail -20 /home/ubuntu/.hermes/logs/gateway.log
```

## Adding a New Platform to config.yaml

When `config.yaml` is missing the `platforms` section entirely:
```python
import yaml
config_path = "~/.hermes/config.yaml"
cfg = yaml.safe_load(open(config_path))
cfg.setdefault("platforms", {})
cfg["platforms"]["telegram"] = {
    "enabled": True,
    "token": "<TOKEN>",
    "allow_all": True,
}
with open(config_path, "w") as f:
    yaml.dump(cfg, f, default_flow_style=False)
```

## Troubleshooting Checklist

1. **"No bot token configured"**: Token missing from `config.yaml` platforms section
2. **"Another gateway already using this token"**: Kill all gateway processes, start one
3. **"Port already in use"**: Clear the port with `sudo fuser -k <port>/tcp`
4. **API key not found**: Check which file the component actually reads (see hierarchy table)
5. **Honcho initialization failed**: Check all 3 config files have the full (non-truncated) key
