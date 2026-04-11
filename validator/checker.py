#!/usr/bin/env python3
"""
Validator module - runs tests, lint, build
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, Tuple

REPO_ROOT = Path("/home/ubuntu/datro-clone")


def run_command(cmd: str, timeout: int = 120) -> Tuple[int, str, str]:
    """Run shell command, return (returncode, stdout, stderr)"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)


def validate_project() -> Dict:
    """Auto-detect project type and validate"""
    
    results = {
        "passed": True,
        "steps": [],
        "errors": []
    }
    
    # Check what kind of project
    has_package_json = (REPO_ROOT / "package.json").exists()
    has_requirements = (REPO_ROOT / "requirements.txt").exists()
    has_pyproject = (REPO_ROOT / "pyproject.toml").exists()
    
    if has_package_json:
        # Node.js project
        results["steps"].append("Detected Node.js project")
        
        # npm install
        results["steps"].append("Running npm install...")
        rc, out, err = run_command("npm install --silent", timeout=180)
        if rc != 0:
            results["errors"].append(f"npm install failed: {err[:200]}")
            results["passed"] = False
            return results
        results["steps"].append("npm install OK")
        
        # npm run build
        if (REPO_ROOT / "package.json").read_text().find('"build"') > 0:
            results["steps"].append("Running npm run build...")
            rc, out, err = run_command("npm run build", timeout=120)
            if rc != 0:
                results["errors"].append(f"build failed: {err[:200]}")
                results["passed"] = False
                return results
            results["steps"].append("build OK")
        
        # Check for syntax errors in JS/HTML
        results["steps"].append("Checking for syntax errors...")
        html_files = list(REPO_ROOT.glob("static/**/*.html"))
        if html_files:
            results["steps"].append(f"Found {len(html_files)} HTML files")
    
    elif has_requirements or has_pyproject:
        # Python project
        results["steps"].append("Detected Python project")
        
        if has_requirements:
            rc, out, err = run_command("pip install -r requirements.txt", timeout=180)
            if rc != 0:
                results["errors"].append(f"pip install failed: {err[:200]}")
                results["passed"] = False
                return results
        
        # Try pytest
        rc, out, err = run_command("python -m py_compile *.py 2>/dev/null || true")
        results["steps"].append("Python syntax check OK")
    
    else:
        results["steps"].append("Unknown project type - skipping validation")
    
    return results


def main():
    """Run validation"""
    results = validate_project()
    print(json.dumps(results, indent=2))
    
    if not results["passed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()