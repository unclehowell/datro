---
name: telegram-fleet-roll-call
description: >
  Set up cross-agent communication in a Telegram bot fleet — discover bot user IDs,
  update all agents' allowed_users to include each other and the human user, restart
  gateways, and verify roll call works. Use when adding a new agent to the fleet or
  when agents can't talk to each other.
category: devops
---

# Telegram Fleet Roll Call Setup

## Problem

Each Hermes gateway filters incoming messages by `allowed_users` in its config.yaml.
If Agent A sends a message to Agent B's bot, Agent B sees it as coming from Agent A's
bot user ID, not Agent B's allowed user. Without cross-listing, agents can't reply to
each other and roll calls fail silently.

## Steps

### 1. Discover all bot user IDs

```python
import requests, json, os

agents = {
    'agent1': '/home/ubuntu/hermes_cmd_agent1/config.yaml',
    'agent2': '/home/ubuntu/hermes_cmd_agent2/config.yaml',
    'agent3': '/home/ubuntu/hermes_cmd_agent3/config.yaml',
    'agent4': '/home/ubuntu/hermes_cmd_agent4/config.yaml',
}

bot_users = {}
for name, cfg_path in agents.items():
    # Extract token from config.yaml
    with open(cfg_path) as f:
        for line in f:
            if 'token:' in line:
                token = line.split('token:')[-1].strip().strip('"').strip("'")
                break
    r = requests.get(f'https://api.telegram.org/bot{token}/getMe')
    data = r.json()
    if data.get('ok'):
        uid = str(data['result']['id'])
        username = data['result'].get('username', '')
        bot_users[name] = {'user_id': uid, 'username': username}
        print(f"{name}: @{username} (id: {uid})")

# Build the combined allowed_users string
user_id = '5837518218'  # Human user's Telegram chat_id
all_ids = [user_id] + [b['user_id'] for b in bot_users.values()]
allowed = ','.join(all_ids)
print(f"\nallowed_users: '{allowed}'")
```

### 2. Update each agent's config.yaml

Edit `platforms.telegram.allowed_users` in every agent:
```yaml
platforms:
  telegram:
    enabled: true
    token: "8672462002:***"
    allowed_users: '5837518218,BOT1_ID,BOT2_ID,BOT3_ID,BOT4_ID'
```

### 3. Restart all gateway processes

```bash
sudo systemctl restart hermes-cmd-agent1 hermes-cmd-agent2 hermes-cmd-agent3 hermes-cmd-agent4
```

Verify running:
```bash
ps aux | grep "hermes gateway" | grep -v grep | wc -l
```

Should return the expected number of agent processes.

### 4. Verify roll call

Send a message to ALL bots simultaneously. Each bot should now reply because they
recognize the sender (which is another bot's user ID, now in their allowed_users).

### 5. Check pairing for new bots

When a new bot is first started, it may need pairing approval:
```
hermes pairing approve telegram <CODE>
```

The code is printed by the bot when it first receives a message from an unknown user.

## Pitfalls

- **Restart required:** Changing `allowed_users` does NOT take effect until the gateway
  process restarts. There is no hot-reload for this setting.
- **Quote the string:** `allowed_users` must be a string in YAML, use `'ID1,ID2,ID3'`.
- **Don't forget the human user:** The human user's chat_id (5837518218) must remain
  in the list, or they lose access.
- **Each machine is separate:** If agents are spread across machines (command, ai, laptop),
  you must update configs on each machine separately.
- **Roll call delivery:** Use `cronjob(action='list')` to find the roll call cron job
  and check its `deliver` target. If it delivers to `origin`, it sends back through
  whatever channel the user contacted from.