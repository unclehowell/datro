# FCUK Sync System

Sync system for `static/fcuk` folder between local datro and GitHub.

## Script
- `/home/ubuntu/bin/fcuk-auto-sync.sh` - runs every 15 mins
- Behavior: 
  1. Fetch remote first
  2. Compare commits
  3. If both changed → merge then push
  4. If only local → push
  5. If only remote → pull
  6. If neither → exit (no API calls)
- No email notifications

## Cron
```cron
*/15 * * * * /home/ubuntu/bin/fcuk-auto-sync.sh
```

## Logs
- `/home/ubuntu/logs/fcuk-auto-sync.log`
- `/home/ubuntu/logs/fcuk-auto-sync.cron.log`