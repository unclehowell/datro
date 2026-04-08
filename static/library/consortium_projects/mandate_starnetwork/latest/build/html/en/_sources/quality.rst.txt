Quality Standards
==================

Script Quality
---------------

- Bash scripts use POSIX-compatible syntax with ``set -uo pipefail``
- Proper exit codes: 0 (success), 1 (failures), 2 (nothing to do)
- Idempotent execution -- safe to run repeatedly
- Timestamped log files in ``/tmp/repo-sync/``
- No credentials or secrets in log output

Git Workflow Quality
---------------------

- Branch naming: ``autosync/{hostname}/{YYYYMMDD-HHMMSS}``
- PRs target the repository default branch (``gh-pages`` or ``main``)
- Commit messages: ``autosync({hostname}): YYYY-MM-DD (N files)``
- Pull operations use ``git pull --rebase`` for linear history
- Conflicts trigger agent fallback, never auto-resolved

Documentation Quality
-----------------------

- ReStructuredText format, Sphinx build verified
- Document IDs: ``MANDATE-STARNET-001``, ``BRIEF-STARNET-001``, etc.
- English HTML and PDF output verified
- ``.treeview.json`` updated in each project directory
- PR preview URL resolves to Cloudflare-served page
