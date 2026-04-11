#!/usr/bin/env python3
"""
Executor module - applies code changes
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional

REPO_ROOT = Path("/home/ubuntu/datro")


def apply_edit(file_path: str, regex_old: str, replacement: str) -> bool:
    """Apply a single edit to a file"""
    fp = REPO_ROOT / file_path
    if not fp.exists():
        print(f"File not found: {file_path}", file=sys.stderr)
        return False
    
    try:
        content = fp.read_text(errors="ignore")
        
        # Try regex first
        if re.search(regex_old, content):
            new_content = re.sub(regex_old, replacement, content)
        else:
            # Try literal
            if regex_old in content:
                new_content = content.replace(regex_old, replacement)
            else:
                print(f"Pattern not found: {regex_old[:50]}...", file=sys.stderr)
                return False
        
        if new_content != content:
            fp.write_text(new_content)
            print(f"Edited: {file_path}", file=sys.stderr)
            return True
        else:
            print(f"No change made to: {file_path}", file=sys.stderr)
            return False
            
    except Exception as e:
        print(f"Error editing {file_path}: {e}", file=sys.stderr)
        return False


def apply_plan(plan: List[Dict]) -> Dict:
    """Apply all steps in a fix plan"""
    
    results = {
        "applied": [],
        "failed": [],
        "skipped": []
    }
    
    for step in plan:
        action = step.get("action", "")
        
        if action == "edit":
            file_path = step.get("file", "")
            regex_old = step.get("regex_old", "")
            replacement = step.get("replacement", "")
            
            if apply_edit(file_path, regex_old, replacement):
                results["applied"].append(file_path)
            else:
                results["failed"].append(file_path)
        
        elif action == "skip":
            results["skipped"].append(step.get("reason", "skipped"))
        
        elif action == "analyze":
            # Log for human review
            results["skipped"].append(f"Needs analysis: {step.get('description', '')}")
        
        else:
            results["skipped"].append(f"Unknown action: {action}")
    
    return results


def main():
    """Read plan from stdin, apply changes"""
    data = sys.stdin.read()
    
    try:
        plan_data = json.loads(data)
        if isinstance(plan_data, list):
            plan = plan_data
        else:
            plan = plan_data.get("plan", [])
        
        if not plan:
            print(json.dumps({"status": "no_plan", "message": "No plan to execute"}))
            return
        
        results = apply_plan(plan)
        print(json.dumps(results, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()