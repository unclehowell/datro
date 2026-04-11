#!/usr/bin/env python3
"""
Memory module - stores previous issues, fixes, failures
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

MEMORY_DIR = Path("/home/ubuntu/datro-clone/memory")
MEMORY_FILE = MEMORY_DIR / "history.json"
MAX_HISTORY = 200


def ensure_memory_dir():
    """Ensure memory directory exists"""
    MEMORY_DIR.mkdir(exist_ok=True)
    if not MEMORY_FILE.exists():
        MEMORY_FILE.write_text(json.dumps({"issues": [], "fixes": [], "failures": []}))


def load_memory() -> Dict:
    """Load memory file"""
    ensure_memory_dir()
    try:
        return json.loads(MEMORY_FILE.read_text())
    except json.JSONDecodeError:
        return {"issues": [], "fixes": [], "failures": []}


def save_memory(memory: Dict):
    """Save memory file"""
    MEMORY_FILE.write_text(json.dumps(memory, indent=2))


def add_issue(issue: Dict):
    """Add issue to memory"""
    memory = load_memory()
    issue["logged_at"] = datetime.now().isoformat()
    memory["issues"].append(issue)
    # Trim
    memory["issues"] = memory["issues"][-MAX_HISTORY:]
    save_memory(memory)


def add_fix(fix: Dict):
    """Add successful fix to memory"""
    memory = load_memory()
    fix["logged_at"] = datetime.now().isoformat()
    memory["fixes"].append(fix)
    memory["fixes"] = memory["fixes"][-MAX_HISTORY:]
    save_memory(memory)


def add_failure(failure: Dict):
    """Add failure to memory"""
    memory = load_memory()
    failure["logged_at"] = datetime.now().isoformat()
    memory["failures"].append(failure)
    memory["failures"] = memory["failures"][-MAX_HISTORY:]
    save_memory(memory)


def get_recent_issues(n: int = 10) -> List[Dict]:
    """Get recent issues"""
    memory = load_memory()
    return memory["issues"][-n:]


def get_recent_fixes(n: int = 10) -> List[Dict]:
    """Get recent fixes"""
    memory = load_memory()
    return memory["fixes"][-n:]


def was_recently_fixed(issue_id: str, days: int = 7) -> bool:
    """Check if issue was fixed recently"""
    memory = load_memory()
    cutoff = datetime.now().timestamp() - (days * 86400)
    
    for fix in memory.get("fixes", []):
        if fix.get("issue_id") == issue_id:
            try:
                logged = datetime.fromisoformat(fix["logged_at"])
                if logged.timestamp() > cutoff:
                    return True
            except Exception:
                pass
    
    return False


def main():
    """CLI for memory operations"""
    if len(sys.argv) < 2:
        # Just load and show
        memory = load_memory()
        print(json.dumps({
            "issues": len(memory["issues"]),
            "fixes": len(memory["fixes"]),
            "failures": len(memory["failures"])
        }, indent=2))
        return
    
    cmd = sys.argv[1]
    
    if cmd == "add-issue":
        issue = json.loads(sys.stdin.read())
        add_issue(issue)
        print(json.dumps({"status": "added"}))
    
    elif cmd == "add-fix":
        fix = json.loads(sys.stdin.read())
        add_fix(fix)
        print(json.dumps({"status": "added"}))
    
    elif cmd == "add-failure":
        failure = json.loads(sys.stdin.read())
        add_failure(failure)
        print(json.dumps({"status": "added"}))
    
    elif cmd == "was-fixed":
        issue_id = sys.argv[2] if len(sys.argv) > 2 else ""
        result = was_recently_fixed(issue_id)
        print(json.dumps({"was_fixed": result}))
    
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()