---
name: datro-repo-autosync-pr
description: Keep /home/ubuntu/datro synced with github.com/unclehowell/datro automatically; when local is ahead, create/update a PR using datro/pr_automation.sh; runs via systemd timer (reboot-safe).
---

# Datro repo autosync + PR automation (reboot-safe)

## When to use

Use this any time you need the `datro` repo on `command.financecheque.uk` to:
- Automatically pull/rebase when GitHub `unclehowell/datro` moves ahead.
- Automatically create/update a PR when the server’s work branch is ahead, so a human can merge.

This is a **server feature** implemented with systemd (not dependent on an LLM being online).

## Design (policy)

- Upstream canonical branch is **origin/HEAD** (typically `gh-pages` for this repo).
- Local work happens on a stable branch (default `auto-sync-ui`).
- If GitHub is ahead: the server rebases the work branch onto upstream.
- If the server is ahead: the server runs `./pr_automation.sh` to create/update a PR.
- The system stores the latest PR URL on disk for notification/inspection.

## Prereqs

1) Repo exists and remote is configured:
- `/home/ubuntu/datro` is a git clone
- `origin` points to `https://github.com/unclehowell/datro.git`

2) GitHub CLI installed + authenticated (non-interactive):
- `gh auth status` must be OK for user `ubuntu`.

3) Permissions:
- `ubuntu` must be able to write:
  - `/var/log/datro-auto-sync.log`
  - `/var/lib/datro-auto-sync/`

## Implementation

### A) Script

Create:
- `/home/ubuntu/datro/scripts/auto-sync.sh`

Responsibilities:
1. Detect upstream branch:
   - `UPSTREAM_BRANCH=$(git remote show origin | awk -F': ' '/HEAD branch/ {print $2; exit}')`
   - fallback to `gh-pages`
2. Checkout work branch (default `auto-sync-ui`).
3. `git fetch origin --prune`
4. `git pull --rebase --autostash origin "$UPSTREAM_BRANCH"`
5. `git add -A` then commit if staged.
6. Compute ahead/behind vs `origin/$UPSTREAM_BRANCH` using:
   - `git rev-list --left-right --count "origin/$UPSTREAM_BRANCH...HEAD"`
7. If ahead > 0:
   - run repo PR script **in UPDATE mode** so PR head contains the actual commits:
     - `DEFAULT_BASE_BRANCH="$UPSTREAM_BRANCH" bash ./pr_automation.sh <<<"2"`
   - extract PR URL from output and write it to:
     - `/var/lib/datro-auto-sync/pr_latest_url.txt`

IMPORTANT: Avoid feeding `pr_automation.sh` via a pipeline (`printf ... | ...`) inside systemd.
That caused intermittent `exit status 141` (SIGPIPE). Use a here-string / heredoc:
- good: `./pr_automation.sh <<<"2"`
- bad:  `printf "2\n" | ./pr_automation.sh`

### B) systemd unit + timer

Create:
- `/etc/systemd/system/datro-auto-sync.service` (Type=oneshot, User=ubuntu, WorkingDirectory=/home/ubuntu/datro)
- `/etc/systemd/system/datro-auto-sync.timer` (every 5 minutes, Persistent=true)

Recommended hardening in service:
- `NoNewPrivileges=true`
- `PrivateTmp=true`
- `ProtectSystem=full`
- `ReadWritePaths=/home/ubuntu/datro /var/log/datro-auto-sync.log /var/lib/datro-auto-sync /tmp`

Enable:
- `systemctl daemon-reload`
- `systemctl enable --now datro-auto-sync.timer`

## Storage locations

- Log:
  - `/var/log/datro-auto-sync.log`
- State:
  - `/var/lib/datro-auto-sync/pr_last_output.txt`
  - `/var/lib/datro-auto-sync/pr_latest_url.txt`
  - `/var/lib/datro-auto-sync/last_pr_epoch`  (PR throttle timestamp)

## Verification

1) Timer enabled:
- `systemctl status datro-auto-sync.timer`

2) Service runs clean:
- `systemctl start datro-auto-sync.service`
- `systemctl status datro-auto-sync.service`

3) PR URL produced (when ahead):
- `cat /var/lib/datro-auto-sync/pr_latest_url.txt`

4) Log sanity:
- `tail -n 200 /var/log/datro-auto-sync.log`

## Common pitfalls (what we learned)

0) Duplicate sync mechanisms causing PR spam
- This machine may already have cron-based sync jobs (e.g. `~/.hermes/repo-sync.sh` via `repo-sync-cron.sh`).
- If `datro-auto-sync.timer` is enabled, disable those cron jobs to enforce a single policy and keep PR creation under control.
  - `crontab -l` then comment out any `repo-sync-cron.sh` lines.

1) State dir permission errors
- Symptom: `Permission denied` writing `/var/lib/datro-auto-sync/pr_last_output.txt`
- Fix:
  - `sudo chown -R ubuntu:ubuntu /var/lib/datro-auto-sync`
  - `sudo chmod 750 /var/lib/datro-auto-sync`

2) systemd exit 141 (SIGPIPE)
- Symptom: `status=141` with no other error
- Causes we hit in the wild:
  - feeding interactive scripts via pipes under systemd
  - masking failures with `trap PIPE` (can make diagnosis harder)
- Fix:
  - Prefer here-string/heredoc input (bash) instead of pipelines.
  - Avoid `trap PIPE` in this oneshot; make sure the script ends with `exit 0` on success.
  - If you see `syntax error near unexpected token '<<<'`, you likely have a broken script (merge-conflict markers) or it’s being executed by `sh` instead of `bash`.

3) PR created from the wrong branch
- If you choose PR script option 1 (create new branch), it will root a fresh `feature/auto-*` branch at origin and may leave your local commits behind (you’ll see “you are leaving X commits behind”).
- For autosync PRs, use option 2 (update/create PR for the current branch) so the PR head contains the actual work-branch commits.

4) PR rate limit (no more than 1 PR per 10 minutes)
- Implement a simple throttle in `auto-sync.sh` using an epoch file:
  - write/read `/var/lib/datro-auto-sync/last_pr_epoch`
  - skip running `pr_automation.sh` if `(now - last) < 600`
- This prevents PR storms if the timer fires frequently or the repo remains ahead.

4) systemd exit 141 (SIGPIPE) even when script works in a shell
- Cause: feeding `pr_automation.sh` via a pipeline inside a oneshot unit can trigger SIGPIPE and make systemd report status=141.
- Fix: do not use `printf ... | ./pr_automation.sh`.
  Use a here-string or heredoc:
  - `./pr_automation.sh <<<"2"`

## Optional: notifications

If you later wire notifications (Telegram, email, etc.), have the notifier send the contents of:
- `/var/lib/datro-auto-sync/pr_latest_url.txt`
whenever it changes.

Do NOT store API keys in this skill.
