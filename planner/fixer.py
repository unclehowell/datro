#!/usr/bin/env python3
"""
Planner module - converts issue into step-by-step fix plan
"""

import json
import sys
from pathlib import Path
from typing import Dict, List

REPO_ROOT = Path("/home/ubuntu/datro-clone")


def generate_fix_plan(issue: Dict) -> List[Dict]:
    """Generate fix plan based on issue type"""
    
    issue_type = issue.get("type", "")
    file_paths = issue.get("file_paths", [])
    description = issue.get("description", "")
    title = issue.get("title", "")
    
    plan = []
    
    if issue_type == "broken-asset":
        # For broken image references - replace with working asset or remove
        for fp in file_paths:
            plan.append({
                "action": "edit",
                "file": fp,
                "description": "Replace broken image reference with svg placeholder or data URI",
                "regex_old": r'src="[^"]*user2-160x160\.jpg"',
                "replacement": 'src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="'
            })
            plan.append({
                "action": "edit",
                "file": fp,
                "description": "Replace broken AdminLTE logo with svg placeholder",
                "regex_old": r'src="[^"]*AdminLTELogo\.png"',
                "replacement": 'src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiMzMzMiLz48L3N2Zz4="'
            })
    
    elif issue_type == "debug-code":
        # Remove console.log statements
        for fp in file_paths:
            plan.append({
                "action": "edit",
                "file": fp,
                "description": "Remove console.log debug statements",
                "regex_old": r'console\.log\([^)]*\);?',
                "replacement": ""
            })
    
    elif issue_type == "todo":
        # For TODOs - convert to proper issue or skip
        plan.append({
            "action": "skip",
            "reason": "TODO items require human review",
            "alternative": "Log to memory for later review"
        })
    
    elif issue_type == "security":
        # For security issues - needs careful review
        plan.append({
            "action": "analyze",
            "description": f"Security issue in {file_paths}. Requires manual review - marking for tracking.",
            "file": file_paths[0] if file_paths else None
        })
    
    elif issue_type == "code-quality":
        # Mark for later, not critical
        plan.append({
            "action": "skip", 
            "reason": "Low severity code quality issue - not worth automated fix",
            "alternative": "Log to memory"
        })
    
    else:
        # Generic - need more analysis
        plan.append({
            "action": "analyze",
            "description": f"Issue: {title}. {description}",
            "file": file_paths[0] if file_paths else None
        })
    
    return plan


def main():
    """Read issue from stdin, output plan to stdout"""
    data = sys.stdin.read()
    
    try:
        issues = json.loads(data)
        if not issues:
            print(json.dumps([], indent=2))
            return
        
        # Get top issue (handle both dict and list)
        if isinstance(issues, list):
            top_issue = issues[0]
        elif isinstance(issues, dict):
            top_issue = issues
        else:
            print(json.dumps({"error": "Invalid input format"}), file=sys.stderr)
            return
        
        plan = generate_fix_plan(top_issue)
        
        output = {
            "issue": top_issue,
            "plan": plan
        }
        
        print(json.dumps(output, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()