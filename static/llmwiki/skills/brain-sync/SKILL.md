---
name: brain-sync
description: Close the learning loop — archive session learnings to brain and sync to GitHub. Trigger after completing any non-trivial task (5+ tool calls, discovered new info, fixed errors).
---

# Brain Sync — Close The Loop

## Architecture

Brain sync is now **on-change (instant)** via `watch-sync.sh`, NOT cron-based.
The `inotifywait` daemon watches the brain directory and auto-commits+pushes within 1-2 seconds of any file change.

## Sync Methods (choose based on situation)

### Method 1: On-Change Watcher (automatic, primary)
The watcher (`scripts/watch-sync.sh`) runs in the background and handles all commits/pushes automatically.

Check if running:
```
pgrep -f "watch-sync.sh"
```
Restart if not:
```
nohup bash ~/brain/scripts/watch-sync.sh > /tmp/brain-watch-sync.log 2>&1 &
```

### Method 2: Manual Sync (fallback)
If watcher is not available:
```bash
bash ${BRAIN_DIR:-$(eval echo ~$(whoami))/brain}/scripts/sync.sh
```
The sync script auto-detects the brain directory from the current user's home — no hardcoded paths.

### Method 3: Direct Git (when sync.sh fails)
```bash
cd $(eval echo ~$(whoami))/brain
git add -A
git commit -m "Brain update: session summary"
git push origin main
```

## GitHub Auth Setup (one-time per machine)

If git push fails with 401:

1. Install gh CLI: `sudo apt-get install gh -y`
2. Authenticate with PAT: `gh auth login --git-protocol ssh --hostname github.com --with-token <<< "YOUR_TOKEN"`
3. Set up git credential helper: `gh auth setup-git`
4. Switch to HTTPS: `git remote set-url origin https://github.com/unclehowell/unclehowell.git`
5. Test: `git fetch origin main`

IMPORTANT: When auth is needed, ask the user for their GitHub PAT — do NOT try to extract it from other machines via SSH/scp.

## Cross-Machine Sync

Brain folders on different machines (laptop vs server) are independent via git. Each machine:
- Has its own local brain directory at `~/brain/`
- Pushes to the shared GitHub repo `github.com/unclehowell/unclehowell.git`
- Other machines pull changes via `git pull` or the on-change watcher

The watch-sync.sh coalesces rapid changes and uses `flock` for race condition safety.

## Architecture: Star Network Sync

All devices sync via `github.com/unclehowell/unclehowell.git` as the central hub:
```
   GitHub (central hub)
    ↑    ↑    ↑
    |    |    |
  AWS2  Laptop  Phone (future)
  (✅)     (⚠️)    (❓)
```

Each device has its own `~/brain/` clone that auto-pushes on change and auto-pulls when remote advances.

## Concurrent Edit Resolution

When two devices edit the same file simultaneously, the **second pusher's Git push is rejected**.
The watcher handles this automatically with the built-in retry loop:
```
for i in 1 2; do
    if git push origin main; then break; fi
    git pull --rebase --autostash origin main
done
```
This is identical to what software teams do: fetch → rebase → push. Git's distributed merge engine handles conflict resolution natively.

## Deploying Watcher to New Machines

### Via Tailscale SSH (for Linux machines):
```bash
ssh $MACHINE_IP "
  cd ~/brain &&
  git pull --rebase origin main &&
  git config pull.rebase true &&
  git config rebase.autoStash true &&
  nohup bash ~/brain/scripts/watch-sync.sh > /tmp/brain-watch-sync.log 2>&1 &
"
```

### Via ADB (for Termux on Android):
Termux requires special setup — ADB shell runs as 'shell' user, not Termux. Use:
```bash
# Open Termux and run inside the app:
pkg install git openssh
gh auth login --git-protocol https
mkdir -p ~/brain && cd ~/brain
git clone https://github.com/unclehowell/unclehowell.git .
termux-setup-storage
# Then set up watch-sync.sh (requires inotify-tools: pkg install inotify-tools)
```

## What to Archive

All scripts use `${BRAIN_DIR:-$(eval echo ~$(whoami))/brain}` to resolve the correct brain path:
- Server: `/home/ubuntu/datro/static/brain`
- Laptop: `/home/ubuntu/datro/static/brain`

## When to Skip

- Quick one-shot answers with no new information
- Trivial conversations

## What to Archive

Always archive:
- Decisions made and why
- Errors encountered and how they were resolved
- New skills created
- Updated skills
- User corrections/preferences (also save via memory tool)
- Environment discoveries (tool paths, API quirks, etc.)

Never archive:
- API keys, passwords, or other secrets
- Temporary/ephemeral state

## When to Skip

- Quick one-shot answers with no new information
- Trivial conversations
