# Auto-Sync: Local ↔ GitHub Repository Sync

## Overview
Automatically keeps `/home/unclehowell/datro` and AWS server `/home/ubuntu/datro` in sync with `github.com/unclehowell/datro`.

## Architecture

### Components
1. **sync-datro script**: Bash script that handles git sync logic
2. **systemd timer**: Runs every 1 minute to check if sync is needed
3. **State files**: Track last sync/push times to enforce throttling

### Locations
- **Local (laptop)**: 
  - Script: `/home/unclehowell/.local/bin/sync-datro`
  - Config: `/home/unclehowell/.config/autosync/`
  - Timer: `~/.config/systemd/user/sync-datro.timer`
  
- **AWS**:
  - Script: `/home/ubuntu/.local/bin/sync-datro`
  - Config: `/home/ubuntu/.config/autosync/`

## Sync Logic

### When Sync Happens
1. **User has local changes** (uncommitted) → immediate fetch/sync
2. **2+ hours since last sync** → allow fetch/sync
3. **Otherwise** → exit silently (no network)

### Push Conditions
- Local is ahead of remote AND
- 2+ hours since last push AND
- No uncommitted changes

### Pull Conditions
- Remote is ahead → fast-forward
- Diverged → pull + manual resolution needed

## Best Practices Implemented

### Git Operations
- **`git fetch origin gh-pages`** → always fetch first
- **`git merge --ff-only`** → only fast-forward, never create merge commits
- Prevents messy git history

### Throttling
- **Check frequency**: 1 minute (lightweight)
- **Sync frequency**: Only when needed
- **Push frequency**: Minimum 2 hours between pushes

## Manual Commands

```bash
# Run sync manually
~/.local/bin/sync-datro

# Check timer status
systemctl --user list-timers sync-datro

# View logs
tail -f ~/.config/autosync/sync.log
tail -f ~/.config/autosync/sync_err.log
```

## Troubleshooting

### Sync not happening
- Check if timer is running: `systemctl --user list-timers sync-datro`
- Check logs: `cat ~/.config/autosync/sync.log`

### Push blocked
- May be due to: uncommitted changes, or < 2 hours since last push
- Check last push time: `cat ~/.config/autosync/last_push`

### Need to force push
- Edit timestamp: `echo $(date +%s) > ~/.config/autosync/last_push`
- Or run: `cd /home/unclehowell/datro && git push origin gh-pages`