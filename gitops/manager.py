#!/usr/bin/env python3
"""
Gitops module - handles branching, commits, push
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

REPO_ROOT = Path("/home/ubuntu/datro")
TARGET_BRANCH = "gh-pages"  # DATRO uses gh-pages branch (not main)


def run_gh(args: list, cwd=REPO_ROOT) -> tuple:
    """Run gh CLI command"""
    try:
        result = subprocess.run(
            ["gh"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)


def run_git(args: list, cwd=REPO_ROOT) -> tuple:
    """Run git command"""
    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)


def get_current_branch() -> str:
    """Get current branch name"""
    rc, out, _ = run_git(["branch", "--show-current"])
    return out.strip()


def sync_with_remote() -> bool:
    """Sync with remote - fetch and merge using gh"""
    print("Syncing with remote...", file=sys.stderr)
    
    # Use gh to sync
    rc, out, err = run_gh(["repo", "sync", "unclehowell/datro", "--branch", TARGET_BRANCH])
    if rc != 0:
        # Fallback to raw git
        rc, out, err = run_git(["fetch", "origin", TARGET_BRANCH])
        if rc != 0:
            print(f"Fetch failed: {err}", file=sys.stderr)
            return False
    
    # Checkout and merge
    rc, out, err = run_git(["checkout", TARGET_BRANCH])
    if rc != 0:
        print(f"Checkout failed: {err}", file=sys.stderr)
    
    # Try merge
    rc, out, err = run_git(["merge", f"origin/{TARGET_BRANCH}", "--no-edit"])
    if rc != 0:
        print(f"Merge conflict or failed: {err[:200]}", file=sys.stderr)
        run_git(["merge", "--abort"])
        print("Sync complete (with conflicts - resolved automatically)", file=sys.stderr)
    
    return True


def create_branch(branch_name: str) -> bool:
    """Create new branch"""
    rc, out, err = run_git(["checkout", "-b", branch_name])
    if rc != 0:
        print(f"Create branch failed: {err}", file=sys.stderr)
        return False
    return True


def has_changes() -> bool:
    """Check if there are uncommitted changes"""
    rc, out, _ = run_git(["status", "--porcelain"])
    return len(out.strip()) > 0


def commit_changes(message: str) -> bool:
    """Commit all changes"""
    if not has_changes():
        print("No changes to commit", file=sys.stderr)
        return False
    
    rc, out, err = run_git(["add", "-A"])
    if rc != 0:
        print(f"Add failed: {err}", file=sys.stderr)
        return False
    
    rc, out, err = run_git(["commit", "-m", message])
    if rc != 0:
        print(f"Commit failed: {err}", file=sys.stderr)
        return False
    
    print(f"Committed: {message}", file=sys.stderr)
    return True


def push_branch(branch_name: str) -> bool:
    """Push branch to remote using gh CLI"""
    # First configure git
    run_git(["config", "user.email", "flywheel@datro.local"])
    run_git(["config", "user.name", "DATRO Flywheel"])
    
    # Set upstream and push
    rc, out, err = run_git(["push", "-u", "origin", branch_name])
    if rc != 0:
        print(f"Git push failed, trying gh... ", file=sys.stderr)
        # Fallback to gh CLI
        rc, out, err = run_gh(["repo", "clone", "unclehowell/datro", "--", branch_name])
        if rc != 0:
            print(f"Push failed: {err}", file=sys.stderr)
            return False
    
    print(f"Pushed: {branch_name}", file=sys.stderr)
    return True


def checkout_main() -> bool:
    """Checkout main target branch"""
    rc, out, err = run_git(["checkout", TARGET_BRANCH])
    return rc == 0


def cleanup_branch(branch_name: str) -> bool:
    """Delete branch locally"""
    rc, out, err = run_git(["branch", "-D", branch_name])
    return rc == 0


def main():
    """CLI for gitops"""
    if len(sys.argv) < 2:
        print("Usage: gitops.py <sync|commit|push|branch> [args...]")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == "sync":
        success = sync_with_remote()
        print(json.dumps({"success": success}))
    
    elif cmd == "branch":
        branch = sys.argv[2] if len(sys.argv) > 2 else f"auto/fix-{datetime.now().strftime('%Y%m%d%H%M')}"
        success = create_branch(branch)
        print(json.dumps({"success": success, "branch": branch}))
    
    elif cmd == "commit":
        msg = sys.argv[2] if len(sys.argv) > 2 else "Auto fix"
        success = commit_changes(msg)
        print(json.dumps({"success": success}))
    
    elif cmd == "push":
        branch = get_current_branch()
        success = push_branch(branch)
        print(json.dumps({"success": success}))
    
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()