#!/usr/bin/env python3
"""
Analyzer module - scans repository and identifies issues
Outputs structured JSON to stdout
"""

import json
import os
import subprocess
import sys
import re
from pathlib import Path
from typing import List, Dict

REPO_ROOT = Path("/home/ubuntu/datro")
EXCLUSIONS = {".git", "node_modules", "dist", ".github", "logs", "memory", "agent", "analyzer", "planner", "executor", "validator", "gitops"}


def find_files(pattern: str = "*.html") -> List[Path]:
    """Find files matching pattern"""
    files = []
    for p in REPO_ROOT.rglob(pattern):
        if any(exc in p.parts for exc in EXCLUSIONS):
            continue
        files.append(p)
    return files


def find_js_files() -> List[Path]:
    return find_files("*.js") + find_files("*.ts")


def find_py_files() -> List[Path]:
    return find_files("*.py")


def find_md_files() -> List[Path]:
    return find_files("*.md")


def scan_todos() -> List[Dict]:
    """Find TODO / FIXME comments"""
    issues = []
    patterns = [r"TODO", r"FIXME", r"HACK", r"XXX", r"BUG"]
    
    for pattern in ["*.html", "*.js", "*.ts", "*.py", "*.sh"]:
        for fp in find_files(pattern):
            try:
                content = fp.read_text(errors="ignore")
                for i, line in enumerate(content.split("\n"), 1):
                    if any(p in line.upper() for p in patterns):
                        issues.append({
                            "id": f"todo-{fp.name}-{i}",
                            "title": f"TODO/FIXME in {fp.name}",
                            "description": line.strip()[:100],
                            "severity": 3,
                            "file_paths": [str(fp.relative_to(REPO_ROOT))],
                            "line": i,
                            "type": "todo"
                        })
            except Exception:
                pass
    return issues[:20]


def scan_html_issues() -> List[Dict]:
    """Scan HTML files for common issues"""
    issues = []
    
    for fp in find_files("*.html"):
        if "node_modules" in str(fp) or "deletable" in str(fp):
            continue
        try:
            content = fp.read_text(errors="ignore")
            rel_path = str(fp.relative_to(REPO_ROOT))
            
            # Check for broken image refs
            if 'src="../assets/img/user2-160x160.jpg"' in content:
                issues.append({
                    "id": f"img-missing-{fp.stem}",
                    "title": f"Broken placeholder image in {fp.name}",
                    "description": "References absent user2-160x160.jpg placeholder",
                    "severity": 5,
                    "file_paths": [rel_path],
                    "type": "broken-asset"
                })
            
            if 'src="../assets/img/AdminLTELogo.png"' in content:
                issues.append({
                    "id": f"img-missing-{fp.stem}",
                    "title": f"Broken AdminLTE logo in {fp.name}",
                    "description": "References absent AdminLTELogo.png",
                    "severity": 5,
                    "file_paths": [rel_path],
                    "type": "broken-asset"
                })
            
            # Check for console.log (should be removed in prod)
            if '<script>' in content and 'console.log' in content:
                issues.append({
                    "id": f"console-{fp.stem}",
                    "title": f"Console.log in production {fp.name}",
                    "description": "Debug console.log statements left in HTML",
                    "severity": 4,
                    "file_paths": [rel_path],
                    "type": "debug-code"
                })
            
            # Check for inline styles (performance)
            if content.count('style="') > 10:
                issues.append({
                    "id": f"inline-style-{fp.stem}",
                    "title": f"Excessive inline styles in {fp.name}",
                    "description": f"Found {content.count('style=')} inline styles",
                    "severity": 2,
                    "file_paths": [rel_path],
                    "type": "code-quality"
                })
                
        except Exception:
            pass
    
    return issues[:15]


def scan_security() -> List[Dict]:
    """Scan for security issues"""
    issues = []
    
    for fp in find_files("*.html") + find_js_files():
        try:
            content = fp.read_text(errors="ignore")
            rel_path = str(fp.relative_to(REPO_ROOT))
            
            # Check for eval() usage
            if "eval(" in content:
                issues.append({
                    "id": f"security-eval-{fp.stem}",
                    "title": f"Dangerous eval() in {fp.name}",
                    "description": "eval() is a security risk",
                    "severity": 8,
                    "file_paths": [rel_path],
                    "type": "security"
                })
            
            # Check for innerHTML without sanitization
            if "innerHTML" in content and "sanitize" not in content.lower():
                issues.append({
                    "id": f"security-html-{fp.stem}",
                    "title": f"Unsafe innerHTML in {fp.name}",
                    "description": "innerHTML without sanitization",
                    "severity": 6,
                    "file_paths": [rel_path],
                    "type": "security"
                })
                
        except Exception:
            pass
    
    return issues[:10]


def scan_js_issues() -> List[Dict]:
    """Scan JS files"""
    issues = []
    
    for fp in find_js_files():
        try:
            content = fp.read_text(errors="ignore")
            rel_path = str(fp.relative_to(REPO_ROOT))
            
            # Check for console.log
            if "console.log" in content:
                issues.append({
                    "id": f"js-console-{fp.stem}",
                    "title": f"Console.log in {fp.name}",
                    "description": "Debug code should be removed",
                    "severity": 3,
                    "file_paths": [rel_path],
                    "type": "debug-code"
                })
            
            # Check for == instead of ===
            if "==" in content and "== " in content:
                issues.append({
                    "id": f"loose-compare-{fp.stem}",
                    "title": f"Loose equality in {fp.name}",
                    "description": "Use === instead of ==",
                    "severity": 2,
                    "file_paths": [rel_path],
                    "type": "code-quality"
                })
                
        except Exception:
            pass
    
    return issues[:10]


def run_lint() -> List[Dict]:
    """Run npm lint if available"""
    issues = []
    
    if not (REPO_ROOT / "package.json").exists():
        return issues
    
    # Check for package script
    try:
        pkg = json.loads((REPO_ROOT / "package.json").read_text())
        if "lint" not in pkg.get("scripts", {}):
            return issues
        
        result = subprocess.run(
            ["npm", "run", "lint"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            issues.append({
                "id": "lint-fail",
                "title": "Lint failure",
                "description": result.stderr[:200],
                "severity": 7,
                "file_paths": [],
                "type": "lint"
            })
    except Exception:
        pass
    
    return issues


def scan_dependencies() -> List[Dict]:
    """Check for vulnerable dependencies"""
    issues = []
    
    try:
        result = subprocess.run(
            ["npm", "audit", "--json"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            try:
                data = json.loads(result.stdout)
                vulns = data.get("vulnerabilities", {})
                if vulns:
                    issues.append({
                        "id": "npm-audit",
                        "title": f"NPM vulnerabilities found",
                        "description": f"{vulns.get('critical', 0)} critical, {vulns.get('high', 0)} high",
                        "severity": 8,
                        "file_paths": ["package.json"],
                        "type": "security"
                    })
            except json.JSONDecodeError:
                pass
    except Exception:
        pass
    
    return issues


def analyze() -> List[Dict]:
    """Main analysis - gathers all issues"""
    all_issues = []
    
    print("Scanning TODOs...", file=sys.stderr)
    all_issues.extend(scan_todos())
    
    print("Scanning HTML...", file=sys.stderr)
    all_issues.extend(scan_html_issues())
    
    print("Scanning security...", file=sys.stderr)
    all_issues.extend(scan_security())
    
    print("Scanning JS...", file=sys.stderr)
    all_issues.extend(scan_js_issues())
    
    print("Scanning dependencies...", file=sys.stderr)
    all_issues.extend(scan_dependencies())
    
    # Sort by severity
    all_issues.sort(key=lambda x: x.get("severity", 0), reverse=True)
    
    # Dedupe by id
    seen = set()
    unique = []
    for issue in all_issues:
        if issue["id"] not in seen:
            seen.add(issue["id"])
            unique.append(issue)
    
    return unique[:50]


if __name__ == "__main__":
    issues = analyze()
    print(json.dumps(issues, indent=2))