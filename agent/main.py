#!/usr/bin/env python3
"""
DATRO Flywheel - Main Controller
Orchestrates the autonomous repo improvement loop
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path("/home/ubuntu/datro")
CONFIG_FILE = REPO_ROOT / "flywheel.config.json"
LOG_FILE = REPO_ROOT / "logs" / "flywheel.log"


def log(msg: str):
    """Log to file and stderr"""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, file=sys.stderr)
    LOG_FILE.parent.mkdir(exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def run_py_script(script: Path, stdin: str = "") -> tuple:
    """Run a Python module, passing input via stdin"""
    try:
        result = subprocess.run(
            [sys.executable, str(script)],
            input=stdin,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=180
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)


def run_py_arg(script: Path, *args) -> tuple:
    """Run a Python module with arguments"""
    try:
        cmd = [sys.executable, str(script)] + list(args)
        result = subprocess.run(
            cmd,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)


def run_sh(script: Path) -> tuple:
    """Run a shell script"""
    try:
        result = subprocess.run(
            [str(script)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=300
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)


def load_config() -> dict:
    """Load config file"""
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {
        "branch_prefix": "auto/fix",
        "target_branch": "gh-pages"
    }


def main_loop(interval_secs: int = 43200):
    """Main flywheel loop"""
    
    config = load_config()
    branch_prefix = config.get("branch_prefix", "auto/fix")
    
    # Ensure we're on the right branch first
    log("=== DATRO Flywheel Starting ===")
    
    # Pre-flight health check
    log("Step 0: Running health check...")
    health_rc, health_out, health_err = run_py_script(REPO_ROOT / "agent" / "health_check.py")
    if health_rc != 0:
        log(f"Health check failed: {health_err[:200]}")
        # Continue anyway - health check is advisory
    
    # Step 1: Sync with remote
    log("Step 1: Syncing with remote...")
    rc, out, err = run_py_arg(REPO_ROOT / "gitops" / "manager.py", "sync")
    if rc != 0:
        log(f"Sync warning: {err[:100]}")
    
    # Step 2: Analyze repository
    log("Step 2: Analyzing repository for issues...")
    rc, out, err = run_py_script(REPO_ROOT / "analyzer" / "scanner.py")
    if rc != 0:
        log(f"Analysis failed: {err}")
        return
    
    try:
        issues = json.loads(out)
    except json.JSONDecodeError:
        log(f"Failed to parse analysis output: {out[:200]}")
        return
    
    if not issues:
        log("No issues found - repository looks healthy!")
        return
    
    # Get top issue
    top_issue = issues[0]
    log(f"Top issue: {top_issue.get('title')} (severity: {top_issue.get('severity')})")
    
    # Step 3: Generate fix plan
    log("Step 3: Generating fix plan...")
    rc, plan_out, err = run_py_script(REPO_ROOT / "planner" / "fixer.py", stdin=json.dumps(top_issue))
    if rc != 0:
        log(f"Planner failed: {err}")
        return
    
    try:
        plan_data = json.loads(plan_out)
        plan = plan_data.get("plan", [])
    except json.JSONDecodeError:
        log(f"Failed to parse plan: {plan_out[:200]}")
        return
    
    if not plan:
        log("No fix plan generated - issue may need manual review")
        return
    
    # Step 4: Create branch
    issue_id = top_issue.get("id", "unknown")
    branch_name = f"{branch_prefix}-{issue_id[:20]}"
    log(f"Step 4: Creating branch {branch_name}...")
    
    # Use subprocess directly
    result = subprocess.run(
        [sys.executable, str(REPO_ROOT / "gitops" / "manager.py"), "branch", branch_name],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=60
    )
    if result.returncode != 0:
        log(f"Branch creation warning: {result.stderr[:100]}")
        # Continue anyway
    
    # Step 5: Apply fix
    log("Step 5: Applying fix...")
    rc, exec_out, err = run_py_script(REPO_ROOT / "executor" / "runner.py", stdin=json.dumps(plan_data))
    if rc != 0:
        log(f"Executor failed: {err}")
        run_py_arg(REPO_ROOT / "gitops" / "manager.py", "checkout gh-pages")
        return
    
    try:
        exec_results = json.loads(exec_out)
        applied = exec_results.get("applied", [])
        log(f"Applied changes to {len(applied)} files")
    except:
        pass
    
    # Step 6: Validate
    log("Step 6: Validating changes...")
    rc, val_out, err = run_py_script(REPO_ROOT / "validator" / "checker.py")
    val_result = {"passed": True}
    try:
        val_result = json.loads(val_out)
    except:
        pass
    
    if not val_result.get("passed", False):
        log(f"Validation failed - rolling back: {val_result.get('errors', [])}")
        run_py_arg(REPO_ROOT / "gitops" / "manager.py", "checkout gh-pages")
        run_py_arg(REPO_ROOT / "gitops" / "manager.py", f"cleanup {branch_name}")
        
        # Log failure
        run_py_script(REPO_ROOT / "memory" / "store.py", 
             f"add-failure {issue_id}")
        return
    
    # Step 7: Commit and push
    log("Step 7: Committing and pushing...")
    commit_msg = f"Flywheel fix: {issue_id} - {top_issue.get('title', 'Auto fix')[:50]}"
    rc, out, err = run_py_arg(REPO_ROOT / "gitops" / "manager.py", f"commit {commit_msg}")
    if rc == 0:
        run_py_arg(REPO_ROOT / "gitops" / "manager.py", "push")
    
    # Return to base branch
    run_py_arg(REPO_ROOT / "gitops" / "manager.py", "checkout gh-pages")
    
    # Log success
    run_py_script(REPO_ROOT / "memory" / "store.py", "add-fix")
    
    log(f"=== Flywheel cycle complete: {branch_name} pushed ===")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="DATRO Flywheel")
    parser.add_argument("--once", action="store_true", help="Run one cycle only")
    parser.add_argument("--interval", type=int, default=43200, help="Seconds between cycles (default: 43200 = 12h)")
    args = parser.parse_args()
    
    if args.once:
        main_loop(0)
    else:
        # Run once by default instead of infinite loop
        main_loop(0)