---
name: hermes-profile-audit
description: Audit and clean up Hermes agent profiles — fix hardcoded keys, add explicit telegram config, resolve gateway/session mismatches. Use when adding new bots, after migration, or when profiles behave unexpectedly.
category: devops
---

# Hermes Profile Audit and Cleanup

## When to run this
- Adding a new bot (Telegram, Discord, etc.)
- After migrating from another system
- When sessions land in the wrong profile
- Periodic security review

## Systematic Approach

### Step 1: Map all profiles and gateways
```bash
# Hermes-native listing (preferred)
hermes profile list

# Filesystem listing (legacy)
ls ~/.hermes/profiles/ 2>/dev/null || true

# List all gateway services (system scope + user scope)
systemctl list-unit-files | grep hermes-gateway || true
systemctl --user list-unit-files | grep hermes-gateway || true

# Check which profiles are RUNNING vs dead
for scope in system --user; do
  for svc in $(systemctl $scope list-unit-files 2>/dev/null | grep hermes-gateway | awk '{print $1}'); do
    state=$(systemctl $scope show -p ActiveState --value $svc)
    echo "  [$scope] $svc: $state"
  done
done
```

### Step 1b: Consolidate profiles (purge) + handle the reserved `default`
Use this when you want to keep ONLY a small set of profiles.

Key findings:
- Hermes refuses to rename the reserved `default` profile ("Cannot rename the default profile").
- On some installs, `default` lives at `~/.hermes` (root), while other profiles live under `~/.hermes/profiles/<name>`.

Procedure (example: keep `backup` and `commandfallback`, and create `commanddefaut` as the effective default):

```bash
# 0) Stop gateways for profiles you’re about to delete (systemd scope varies)
# If a gateway is running, profile deletion may leave residual state.db-wal / pid files.
sudo systemctl stop hermes-gateway-<profile> 2>/dev/null || true
systemctl --user stop hermes-gateway-<profile> 2>/dev/null || true

# 1) Delete unwanted profiles
hermes profile delete -y <profile>

# If Hermes reports directory-not-empty (usually because gateway wrote locks), clean up:
rm -rf ~/.hermes/profiles/<profile>

# 2) "Rename default" workaround: clone it to a new profile
hermes profile create commanddefaut --clone-from default --clone --no-alias
hermes profile use commanddefaut
hermes profile alias commanddefaut

# 3) Retire the reserved root `default` (disable accidental usage)
# IMPORTANT: ensure any *running* gateway profile has its own .env BEFORE you retire root .env
install -m 600 ~/.hermes/.env ~/.hermes/profiles/commandfallback/.env 2>/dev/null || true

# Backup the root default key files (avoids `hermes profile export` symlink issues)
TS=$(date -u +%Y%m%dT%H%M%SZ)
tar -czf ~/default.root-files.pre-retire.$TS.tar.gz \
  ~/.hermes/config.yaml ~/.hermes/.env ~/.hermes/SOUL.md ~/.hermes/auth.json ~/.hermes/honcho.json \
  2>/dev/null || true

# Replace root .env with a stub
mv ~/.hermes/.env ~/.hermes/.env.retired.$TS
cat > ~/.hermes/.env <<'EOF'
# RETIRED DEFAULT PROFILE
# Use profile: commanddefaut (sticky) or commandfallback (gateway).
EOF
chmod 600 ~/.hermes/.env

# Disable the root default model + fallbacks
# (Edit ~/.hermes/config.yaml): set provider/model to a dummy, and set fallback_providers: []

# Restart and verify the gateway you kept
sudo systemctl restart hermes-gateway-commandfallback
sudo systemctl --no-pager --full status hermes-gateway-commandfallback | sed -n '1,80p'
```

Notes:
- `hermes profile export default` can fail if it tries to follow/bundle broken symlinks; the tarball approach above is a robust backup.
- After retiring root `default`, `hermes profile show default` should display something like `Model: RETIRED (retired)` and `Gateway: stopped`.

### Step 2: Check profile config against running process
```bash
# Find the active gateway PID
ps aux | grep "hermes_cli.main gateway" | grep -v grep

# Check which profile the running gateway uses
cat /proc/<PID>/environ | tr '\0' '\n' | grep HERMES_HOME

# Check where sessions actually land
for p in $(ls ~/.hermes/profiles/); do
    echo "=== $p ==="
    python3 -c "
import json, glob
for sf in glob.glob('$HOME/.hermes/profiles/$p/sessions/sessions.json'):
    with open(sf) as f:
        sessions = json.load(f)
    for k, v in sessions.items():
        print(f'  {k}: updated={v.get(\"updated_at\", \"?\")} platform={v.get(\"platform\", \"?\")}')
" 2>/dev/null || echo "  no sessions"
done
```

Key finding: Active sessions must be in the same profile as the running gateway. If not, sessions are orphaned.

### Step 3: Audit for hardcoded secrets
```bash
# Find all hardcoded API keys (should use api_key_env, not api_key)
for p in ~/.hermes/profiles/*/config.yaml; do
    echo "=== $(dirname $p | xargs basename) ==="
    grep -n "api_key:" "$p" | grep -v "api_key_env"
done

# Find custom_providers with hardcoded keys
for p in ~/.hermes/profiles/*/config.yaml; do
    grep -A3 "custom_providers" "$p" | grep "api_key:"
done
```

Fix: Replace `api_key: actual_value` with `api_key_env: VAR_NAME`
Then put the actual value in the profile's .env file or ~/.hermes/.env

### Step 4: Ensure explicit telegram config in each profile
```bash
# Check if profiles have their own telegram section
for p in ~/.hermes/profiles/*/config.yaml; do
    echo "=== $(dirname $p | xargs basename) ==="
    grep -A2 "^telegram:" "$p" || echo "  NO explicit telegram (inherits from global)"
done
```

Each profile needs:
```yaml
telegram:
  bot_token: "${TELEGRAM_BOT_TOKEN}"  # or "${PROFILE_NAME_TELEGRAM_BOT_TOKEN}" for secondary bots
```

The global config.yaml should NOT carry additional_bots — each profile owns its bot.

### Step 5: Add bot tokens to .env files
For each profile that has a unique bot:
```bash
echo "TELEGRAM_BOT_TOKEN=bot:full_token_here" >> ~/.hermes/profiles/<profile>/.env
```

### Step 5b: Verify config key names AND structure (CRITICAL)

**Root cause of "No messaging platforms enabled" with correct-looking configs:**

The `GatewayConfig.from_dict()` method in `gateway/config.py` ONLY reads from the `platforms:` section (line 344-350). A flat `telegram:` section at top level is IGNORED for `enabled` and `token`. The `load_gateway_config()` merge function only bridges `unauthorized_dm_behavior`, `reply_prefix`, `require_mention`, and `mention_patterns` — NOT `enabled` or `token`.

**WRONG (gateway ignores this):**
```yaml
telegram:
  enabled: true
  token: "8672462002:AAHxxx"
```

**CORRECT:**
```yaml
platforms:
  telegram:
    enabled: true
    token: "8672462002:AAHxxx"
telegram:
  enabled: true      # keep top-level for legacy compat
  token: "8672462002:AAHxxx"
```

**Automated fix for broken configs:**
```bash
for cfg in /home/ubuntu/hermes_cmd_agent*/config.yaml; do
    python3 -c "
import yaml
with open('$cfg') as f:
    c = yaml.safe_load(f)
tg = c.get('telegram', {})
if tg and tg.get('enabled'):
    c.setdefault('platforms', {})
    c['platforms']['telegram'] = {'enabled': True, 'token': tg.get('token', '')}
with open('$cfg', 'w') as f:
    yaml.dump(c, f, default_flow_style=False, sort_keys=False)
"
done
```

**Systemd service files must also set env vars** — even when config.yaml has tokens, the gateway adapters read from env vars during connection:
```ini
[Service]
Environment=HERMES_HOME=/home/ubuntu/hermes_cmd_agent1
Environment=TELEGRAM_BOT_TOKEN=8672462002:AAHxxx
Environment=TELEGRAM_ALLOWED_USERS=5837518218
```

**Key naming rules:**
- Config yaml: `token:` (NOT `bot_token:`)
- Env var: `TELEGRAM_BOT_TOKEN`
- Missing `TELEGRAM_ALLOWED_USERS` in service = all DMs rejected with "No user allowlists configured"

**Diagnostic command:**
```bash
# Check if gateway actually loaded the platform config
journalctl -u hermes-cmd-agent1.service -n 20 --no-pager
# "No messaging platforms enabled" = config structure wrong
# "No user allowlists configured" = TELEGRAM_ALLOWED_USERS not set in service
```

### Step 5c: Verify pairing status
If a bot responds with "I don't recognize you yet! Here's your pairing code:", the user hasn't been approved yet:
```bash
hermes pairing approve telegram <CODE>
```
Pairing codes expire quickly — the gateway agent must be running continuously for the approval to stick before the user reconnects.

### Step 6: Restart gateways after changes
```bash
# Restart the specific profile gateway
systemctl --user restart hermes-gateway-<profile>.service

# Verify it started
systemctl --user status hermes-gateway-<profile>.service --no-pager -n 3

# Check the new process environment
PID=$(ps aux | grep "hermes_cli.main gateway" | grep -v grep | head -1 | awk '{print $2}')
cat /proc/$PID/environ | tr '\0' '\n' | grep HERMES_HOME
```

### Step 7: Archive orphaned session learnings to brain
```bash
# If sessions are in a dead profile, archive their memory
# The session memory lives in ~/.hermes/profiles/<profile>/sessions/
# Key learnings should be moved to ~/.hermes/brain/memory/archive/learned/
```

## Pitfalls
- Profiles inherit telegram from global config.yaml if no explicit section — this causes bot routing confusion
- Hardcoded keys in custom_providers are invisible to the main model key check
- The gateway process env (HERMES_HOME) must match where you expect sessions
- `--replace` flag on gateway run kills any other gateway on the same bot
- Multiple gateways can run if they use different bot tokens

## Skip Pairing Codes — Allow All Users

If bots respond with "I don't recognize you yet! Here's your pairing code:" for every DM, either:

**Option A — Set GATEWAY_ALLOW_ALL_USERS=true in systemd service (fastest):**
```ini
[Service]
Environment=GATEWAY_ALLOW_ALL_USERS=true
```

**Option B — Approve the user:**
```bash
hermes pairing approve telegram <CODE>
```
Pairing codes expire within minutes — the gateway must stay running for approval to stick. GATEWAY_ALLOW_ALL_USERS is the reliable approach for personal setups.

## Disable Exec Approvals Permanently

To eliminate interactive exec approval prompts ("This command is dangerous. Approve?"):

```yaml
# ~/.hermes/config.yaml
approvals:
  mode: off
  timeout: 0
```

After changing, **restart the gateway** for the setting to take effect:
```bash
sudo systemctl restart hermes-gateway
```

**WARNING:** Only use `mode: off` on personal/trusted machines. Combined with `GATEWAY_ALLOW_ALL_USERS=true`, this gives the agent full shell access with zero human-in-the-loop — no warnings, no confirmations.

## Roll Call Video Generator

Reusable script that generates a 5-second status card video and delivers it to Jellyfin:

**Location:** `/home/ubuntu/.hermes/scripts/rollcall_video.py`

**What it does:**
1. Scans all hermes gateway processes + systemd services for agent status
2. Creates a 1920x1080 PNG title card with Hermes green accent (#04da97), showing each agent with status icon
3. Uses ffmpeg to render a 5-second H.264 MP4
4. Copies to Jellyfin library: `/var/lib/jellyfin/root/default/Videos/Manim - Roll Call Status YYYYMMDD_HHMMSS.mp4`
5. Triggers Jellyfin library scan via API

**Usage:**
```bash
python3 /home/ubuntu/.hermes/scripts/rollcall_video.py
```

**Schedule as cron (every 4 hours):**
```
python3 /home/ubuntu/.hermes/scripts/rollcall_video.py
```

**Dependencies:** ffmpeg (system), Pillow (Python 3 — `pip install --break-system-packages Pillow`)

**Jellyfin path note:** Videos dir must be writable by the running user:
```bash
sudo chown ubuntu:ubuntu /var/lib/jellyfin/root/default/Videos
```
