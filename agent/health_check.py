#!/usr/bin/env python3
"""
Flywheel Health Check Module
Verifies system readiness before each flywheel cycle
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path("/home/ubuntu/datro")
LOG_FILE = REPO_ROOT / "logs" / "flywheel-health.log"
CONFIG_FILE = REPO_ROOT / "flywheel.config.json"


def log(msg: str):
    """Log to file and stdout"""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, file=sys.stderr)
    LOG_FILE.parent.mkdir(exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def run_cmd(cmd: list, timeout: int = 30, cwd: str = None) -> tuple:
    """Run command, return (returncode, stdout, stderr)"""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, cwd=cwd
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Timeout"
    except Exception as e:
        return -1, "", str(e)


def check_hermes_llm() -> dict:
    """Check Hermes LLM providers and fallback chain"""
    result = {
        "status": "unknown",
        "providers": [],
        "errors": []
    }
    
    # Check hermes command available
    rc, out, err = run_cmd(["which", "hermes"])
    if rc != 0:
        result["errors"].append("Hermes command not found")
        return result
    
    # Try to get model info
    rc, out, err = run_cmd(["hermes", "model"], timeout=15)
    if rc != 0:
        result["errors"].append(f"Hermes model list failed: {err[:100]}")
    
    # Test fallback chain by checking config
    config_path = Path.home() / ".hermes" / "config.yaml"
    if config_path.exists():
        # Read and check fallback providers
        config_text = config_path.read_text()
        if "fallback_providers" in config_text:
            result["status"] = "ok"
            result["providers"].append("fallback_providers_defined")
    else:
        result["errors"].append("No hermes config found")
    
    # Check Cloudflare API access
    env_path = Path.home() / ".hermes" / ".env"
    if env_path.exists():
        env_text = env_path.read_text()
        if "CLOUDFLARE_API_KEY" in env_text and "CLOUDFLARE_EMAIL" in env_text:
            result["providers"].append("cloudflare_configured")
    
    return result


def check_system_resources() -> dict:
    """Check disk, memory, CPU"""
    result = {"status": "ok", "issues": []}
    
    # Disk space
    rc, out, err = run_cmd(["df", "-h", "/home/ubuntu"])
    if rc == 0:
        lines = out.strip().split("\n")
        if len(lines) >= 2:
            parts = lines[1].split()
            if len(parts) >= 5:
                usage = parts[4].rstrip("%")
                try:
                    if int(usage.rstrip("%")) > 90:
                        result["issues"].append(f"Disk usage high: {usage}")
                except:
                    pass
    
    # Memory
    rc, out, err = run_cmd(["free", "-h"])
    if rc == 0:
        # Check available memory
        if "Mem:" in out:
            for line in out.split("\n"):
                if line.startswith("Mem:"):
                    parts = line.split()
                    if len(parts) >= 7:
                        avail_gb = parts[6]  # Available column
                        # Just log it
                        result["memory"] = avail_gb
    
    # Check if we can write
    test_file = REPO_ROOT / ".health-check-test"
    try:
        test_file.write_text("test")
        test_file.unlink()
    except Exception as e:
        result["issues"].append(f"Cannot write to repo: {e}")
    
    if result["issues"]:
        result["status"] = "warning"
    
    return result


def check_network_connectivity() -> dict:
    """Check internet and GitHub connectivity"""
    result = {"status": "ok", "errors": []}
    
    # GitHub
    rc, out, err = run_cmd([
        "curl", "-s", "--max-time", "10",
        "https://api.github.com"
    ])
    if rc != 0 or "rate limit" in out.lower() or "error" in out.lower():
        result["errors"].append("GitHub API unreachable or rate limited")
        result["status"] = "warning"
    
    # OpenCode AI
    rc, out, err = run_cmd([
        "curl", "-s", "--max-time", "5",
        "https://opencode.ai/zen/v1/models"
    ], timeout=10)
    if rc != 0:
        result["errors"].append("OpenCode AI unreachable")
    
    # Groq
    rc, out, err = run_cmd([
        "curl", "-s", "--max-time", "5",
        "https://api.groq.com/openai/v1/models"
    ], timeout=10)
    if rc != 0:
        result["errors"].append("Groq API unreachable")
    
    return result


def check_git_health() -> dict:
    """Check git repo status"""
    result = {"status": "ok", "issues": []}
    
    # Check we're in a git repo
    rc, out, err = run_cmd(["git", "rev-parse", "--git-dir"], cwd=REPO_ROOT)
    if rc != 0:
        result["issues"].append("Not a git repository")
        result["status"] = "error"
        return result
    
    # Check remote
    rc, out, err = run_cmd([
        "git", "ls-remote", "--heads", "origin", "gh-pages"
    ], cwd=REPO_ROOT, timeout=15)
    if rc != 0:
        result["issues"].append("Cannot reach origin/gh-pages")
        result["status"] = "warning"
    
    # Check for uncommitted changes
    rc, out, err = run_cmd(["git", "status", "--short"], cwd=REPO_ROOT)
    if rc == 0 and out.strip():
        result["uncommitted"] = len(out.strip().split("\n"))
    
    return result


def check_package_updates() -> dict:
    """Check for system and package updates"""
    result = {"status": "ok", "updates": []}
    
    # System packages (quiet, check return code)
    rc, out, err = run_cmd(["apt", "update", "-qq"], timeout=60)
    if rc == 0:
        rc, out, err = run_cmd([
            "apt", "list", "--upgradable", "2>/dev/null"
        ], timeout=30)
        if rc == 0 and out.strip():
            count = len([l for l in out.split("\n") if "/" in l])
            if count > 0:
                result["updates"].append(f"{count} system packages")
    
    return result


def run_health_check() -> dict:
    """Run all health checks"""
    log("=== Running Flywheel Health Check ===")
    
    health = {
        "timestamp": datetime.now().isoformat(),
        "overall": "ok",
        "checks": {}
    }
    
    # 1. Hermes LLM
    log("Check 1: Hermes LLM...")
    llm_check = check_hermes_llm()
    health["checks"]["llm"] = llm_check
    if llm_check["status"] != "ok":
        health["overall"] = "warning"
        log(f"  LLM: {llm_check.get('errors', ['unknown'])}")
    
    # 2. System Resources
    log("Check 2: System Resources...")
    sys_check = check_system_resources()
    health["checks"]["system"] = sys_check
    if sys_check["status"] != "ok":
        health["overall"] = "warning"
        log(f"  System: {sys_check.get('issues', [])}")
    
    # 3. Network
    log("Check 3: Network Connectivity...")
    net_check = check_network_connectivity()
    health["checks"]["network"] = net_check
    if net_check["status"] != "ok":
        health["overall"] = "warning"
        log(f"  Network: {net_check.get('errors', [])}")
    
    # 4. Git
    log("Check 4: Git Health...")
    git_check = check_git_health()
    health["checks"]["git"] = git_check
    if git_check["status"] not in ["ok", "warning"]:
        health["overall"] = "error"
        log(f"  Git: {git_check.get('issues', [])}")
    
    # 5. Packages
    log("Check 5: Package Updates...")
    pkg_check = check_package_updates()
    health["checks"]["packages"] = pkg_check
    
    log(f"=== Health Check Complete: {health['overall']} ===")
    
    # Save health report
    health_file = REPO_ROOT / "logs" / "flywheel-health-latest.json"
    health_file.write_text(json.dumps(health, indent=2))
    
    return health


if __name__ == "__main__":
    result = run_health_check()
    sys.exit(0 if result["overall"] in ["ok", "warning"] else 1)