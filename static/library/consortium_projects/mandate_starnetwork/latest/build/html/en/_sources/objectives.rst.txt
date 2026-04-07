Objectives
==========

Primary Objectives
------------------

1. **Automated Change Detection** -- Each endpoint runs a cron job every 5 minutes to check tracked repositories for uncommitted changes.

2. **Auto-Commit and Push** -- Repositories with 500 or fewer changed files are automatically committed and pushed to a branch named ``autosync/{hostname}/{timestamp}`` on GitHub.

3. **Automatic PR Creation** -- Pushing to an autosync branch triggers creation of a pull request targeting the default branch (``gh-pages`` or ``main``).

4. **Telegram Delivery** -- The PR URL is sent to the client's Telegram chat for review and approval before merging.

5. **Remote Change Pulling** -- Each endpoint monitors its tracked branch on GitHub for new commits and pulls them automatically via ``git fetch`` and ``git pull --rebase``.

6. **Agent Fallback** -- When sync fails (merge conflicts, push rejection, network errors), a Hermes agent is spawned in YOLO mode to diagnose and resolve the issue without human intervention.

7. **static/ui Propagation** -- Push the 432-file ``static/ui`` folder from aws-command to GitHub, creating a PR for client review.

Secondary Objectives
---------------------

8. **Documentation Protocol** -- Establish the Mandate/Brief/Plan workflow as the standing order for all future agent tasks across all three machines.

9. **Semantic Versioning** -- All project documents follow semantic versioning with proper backup of superseded versions.

10. **Library Standards** -- Follow established Datro Consortium documentation formatting, build with Sphinx, produce HTML and PDF.
