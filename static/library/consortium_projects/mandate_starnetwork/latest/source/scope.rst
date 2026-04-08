Scope
=====

In Scope
---------

The following work is within the scope of the StarSync Network project:

- Cron-based sync script deployment on the laptop (16 repos)
- Cron-based sync script deployment on the Command AWS endpoint (2 repos)
- Telegram bot integration for PR delivery notifications
- Hermes YOLO-mode agent fallback for sync failure recovery
- Automatic commit, push, and PR creation for repos under 500 changes
- Automatic pull of remote changes from GitHub on all endpoints
- Push of ``static/ui`` (432 files) from Command AWS to GitHub (PR #264)
- Creation of Mandate, Brief, Plan, and Highlight Report documents
- Sphinx build of HTML and PDF for all four documents
- Pull request creation with preview links for client review

Out of Scope
--------------

The following work is explicitly excluded:

- AI AWS endpoint configuration (not reachable, deferred to future work)
- Automated merging of pull requests (client must approve each PR)
- Compilation of non-English documents (English only for this version)
- Resolution of the 28,000+ uncommitted changes in datro on the laptop
- Resolution of the 34,000+ uncommitted changes in datro on the Command AWS
- GUI bug fixes or link generator repair (handled by InfraSync project)
- New feature development in any monitored repository
