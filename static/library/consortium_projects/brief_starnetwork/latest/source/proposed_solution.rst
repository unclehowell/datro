Proposed Solution
==================

Architecture
--------------

The synchronization system uses a star network topology with GitHub at the center.

::

    +----------+     push/PULL      +-----------+     pull/PUSH      +-----------+
    |  Laptop  | <----------------> |   GitHub  | <----------------> |  AWS Cmd  |
    | 16 repos |                    |  (hub)    |                    |  2 repos  |
    +----------+                    +-----------+                    +-----------+
         ^                               ^
         |                               |
         v                               v
    +-----------+
    |  AWS AI   |   (not yet reachable)
    |   TBD     |
    +-----------+

Component Design
----------------

1. Sync Script (repo-sync.sh)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A bash script deployed on each endpoint that:

- Reads a list of tracked repositories from a config file
- For each repo:
  - Counts uncommitted changes (``git status --porcelain``)
  - Fetches from origin to check for remote updates
  - If behind origin: stashes local changes, pulls with rebase, restores stash
  - If changes exist and count <= 500: commits, pushes to an autosync branch
  - Creates a PR via ``gh pr create``
  - Sends a Telegram notification with the PR URL
- Returns exit code 0 (ok), 1 (failures), or 2 (nothing to do)

2. Telegram Notification
~~~~~~~~~~~~~~~~~~~~~~~~~

Upon PR creation, the script uses the Telegram Bot API to send an HTML-formatted
message containing:

- The origin hostname
- Repository name
- Number of files changed
- A clickable link to the PR on GitHub

3. Agent Fallback (repo-sync-agent.sh)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When the cron detects a non-zero exit code from the sync script, it invokes
a Hermes agent using the ``reposync`` profile in YOLO mode with the instruction
to diagnose and resolve the failure. The agent:

- Reads the latest sync log from ``/tmp/repo-sync/``
- Attempts automated resolution (abort, reset, conflict handling)
- Reports results via Telegram
- This enables self-healing sync operations without human intervention

4. Cron Orchestration
~~~~~~~~~~~~~~~~~~~~~~

Each endpoint has a cron entry running every 5 minutes:

``*/5 * * * * /path/to/repo-sync-cron.sh >> /tmp/repo-sync/cron.log 2>&1 || /path/to/repo-sync-agent.sh >> /tmp/repo-sync/cron.log 2>&1``

The ``||`` operator ensures the agent fallback runs only when the sync script
exits with a non-zero code (failures).

5. Repository Tracking
~~~~~~~~~~~~~~~~~~~~~~~

A simple text file (``reposync_repos.txt``) lists full paths to all tracked
repositories on each endpoint. Lines starting with ``#`` are comments, empty
lines are ignored. This file is machine-specific.

Data Flow
-----------

1. User makes changes in a repo on **laptop**
2. Cron runs (within 5 min): detects changes, commits, pushes
3. Push creates ``autosync/laptop/20260407-XXXXXX`` branch on GitHub
4. PR is created targeting ``gh-pages``
5. Telegram message sent to client with PR URL
6. Client reviews at the GitHub PR page and merges
7. Next cron cycle on **aws-command** pulls the merged changes
8. All endpoints are now in sync
