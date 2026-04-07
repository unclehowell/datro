Risks and Mitigations
======================

+----------------------------+-------------+--------------------------------------+
| Risk                       | Probability | Mitigation                           |
+============================+=============+======================================+
| Disk space exhaustion      | Medium      | Scripts skip repos > 500 files;    |
|                            |             | log cleanup; no large auto-commits  |
+----------------------------+-------------+--------------------------------------+
| Merge conflicts on pull    | High        | Agent auto-fallback resolves        |
|                            |             | conflicts autonomously              |
+----------------------------+-------------+--------------------------------------+
| AWS connectivity loss      | Low         | Cron retries every 5 minutes;       |
|                            |             | logs failures for later review      |
+----------------------------+-------------+--------------------------------------+
| Telegram rate limiting     | Low         | One message per sync cycle, not     |
|                            |             | per change; well within limits      |
+----------------------------+-------------+--------------------------------------+
| Accidental auto-merge      | Low         | Script never runs gh pr merge;      |
|                            |             | client must approve manually        |
+----------------------------+-------------+--------------------------------------+
| Honcho memory not working  | High        | api.honcho.dev currently timing     |
|                            |             | out; use built-in memory fallback   |
+----------------------------+-------------+--------------------------------------+
