Constraints
===========

Technical Constraints
----------------------

- **Budget** -- Zero additional cost. Uses existing infrastructure: laptop workstation, AWS EC2 instance (13.135.142.244), and GitHub repositories.

- **API Dependencies** -- Requires OpenRouter API key, Telegram Bot Token (8107308256), and GitHub Personal Access Token. All credentials exist on the laptop and Command AWS.

- **Network** -- The laptop may have intermittent connectivity. The Command AWS has stable connectivity but shares a public IP. The AI AWS endpoint is not currently reachable via SSH.

Operational Constraints
-------------------------

- **No Auto-Merge** -- Pull requests must be reviewed and merged manually by the client. Never auto-merge.

- **Change Threshold** -- Repositories with more than 500 uncommitted files are explicitly skipped. Manual review is required before these changes are committed.

- **YOLO Mode** -- The agent fallback runs in YOLO mode, meaning no approval prompts. It executes autonomously to resolve failures.

- **Cron Frequency** -- Every 5 minutes for change detection. No more frequent to avoid API rate limits.

Documentation Constraints
---------------------------

- All project documentation must use ReStructuredText (``.rst``) format.
- Sphinx is the build system for HTML and PDF output.
- Documents are placed under ``datro/static/library/consortium_projects/``.
- Build output includes HTML (English) and PDF.
- The ``consortium_projects/.treeview.json`` file must be updated.
