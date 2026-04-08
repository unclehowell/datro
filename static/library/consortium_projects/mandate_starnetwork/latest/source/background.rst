Background
===========

The DATRO Consortium operates multiple development endpoints that each maintain local clones of Git repositories. Changes made independently on any endpoint need to propagate through a central GitHub repository to all other endpoints. This creates a star network topology where GitHub is the central hub and each machine is a spoke.

Current State
--------------

The situation before this project:

1. **No Automated Sync** -- Each machine requires manual ``git add``, ``commit``, ``push``, and ``pull`` operations. Changes made on one machine do not automatically appear on others.

2. **No PR Automation** -- Local changes are not automatically proposed as pull requests with preview links for client review.

3. **No Remote Monitoring** -- No system detects when GitHub is updated or automatically pulls new changes to local endpoints.

4. **static/ui Blocked** -- The ``static/ui`` folder on the Command AWS (13.135.142.244) has 432 files that have not been pushed to GitHub, preventing sync to the laptop.

5. **Excessive Local Changes** -- The ``datro`` repository on the laptop has 28,398 uncommitted changes; on the Command AWS it has 34,886. These cannot be safely auto-committed.

6. **No Standardised Documentation** -- Tasks given to agents were not documented in the Datro Consortium Mandate/Brief/Plan format with PR preview links and semantic versioning.

Endpoint Inventory
--------------------

==================  =================  =============================================
Endpoint            Address            Repositories Tracked
==================  =================  =============================================
laptop              Local machine      16 repos
aws-command         13.135.142.244    2 repos (datro, brain)
aws-ai              Not yet reachable  Pending configuration
GitHub (hub)        github.com/unclehowell  All repositories
==================  =================  =============================================
