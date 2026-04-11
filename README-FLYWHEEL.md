# DATRO Flywheel

Autonomous self-improving repo system for unclehowell/datro

## Overview

The flywheel continuously monitors and improves the DATRO monorepo by:
1. Scanning for issues (TODOs, broken assets, security, lint)
2. Ranking by severity  
3. Generating and applying fixes
4. Validating and pushing to a new branch

## Structure

```
/agent/main.py       - Main controller
/analyzer/scanner.py - Issue detection
/planner/fixer.py    - Fix plan generation
/executor/runner.py  - Apply code changes
/validator/checker.py - Tests/lint/build
/gitops/manager.py   - Git operations
/memory/store.py    - History storage
flywheel.config.json - Configuration
```

## Usage

```bash
# Run one cycle
python3 agent/main.py --once

# Or via cron (twice daily)
/home/ubuntu/datro-clone/agent/main.py --once
```

## Configuration

Edit `flywheel.config.json`:
- `interval_seconds` - Loop interval (default 12h)
- `branch_prefix` - Prefix for auto-branches
- `target_branch` - Main branch (gh-pages for DATRO)
- `safety.abort_on_test_fail` - Stop on validation fail

## Safety

- NEVER pushes directly to main/gh-pages
- Creates new branch per fix: `auto/fix-<issue-id>`
- Aborts if tests/build fail
- Skips .env, secrets, credentials

## Logs

- `/home/ubuntu/datro-clone/logs/flywheel.log` - Main log
- `/home/ubuntu/datro-clone/memory/history.json` - Issue history

## Test

```bash
# Test individual modules
python3 analyzer/scanner.py
python3 planner/fixer.py < issues.json
python3 executor/runner.py < plan.json
python3 validator/checker.py
```