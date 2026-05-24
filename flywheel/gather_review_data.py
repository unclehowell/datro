#!/usr/bin/env python3
"""Gather AWS release data for the meta-review."""
import json, re, sys
from pathlib import Path

AWS_STATE = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
AWS_PROFILES = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
AWS_LOG = sys.argv[3].split("\n") if len(sys.argv) > 3 else []
LOCAL_STATE_FILE = Path.home() / ".fcukproxy" / "release-state.json"

total_releases = AWS_STATE.get("total_releases", {})
last_release = AWS_STATE.get("last_release", {})
rotation_idx = AWS_STATE.get("rotation_index", "?")
fix_rotation = AWS_STATE.get("fix_rotation", "?")
total_count = sum(total_releases.values())

# Parse fix sources from log lines — classify each release's fixes by source
fix_sources = {"AI": 0, "POOL": 0, "FALLBACK": 0}
recent_releases = []
unique_fix_types = set()
current_release_source = None

for line in AWS_LOG:
    if "MULTI-BRANCH RELEASE" in line:
        current_release_source = None  # reset for new release cycle
    elif "AI pass" in line and "Falling through to pool" not in line:
        if "AI fix applied and validated" in line:
            fix_sources["AI"] = fix_sources.get("AI", 0) + 1
    elif "Pool attempt" in line:
        pass  # pool running — we track when it succeeds below
    elif "Pool fix applied" in line:
        fix_sources["POOL"] = fix_sources.get("POOL", 0) + 1
    elif "guaranteed" in line.lower() and "applied" in line.lower():
        fix_sources["FALLBACK"] = fix_sources.get("FALLBACK", 0) + 1
    elif "RELEASE COMPLETE" in line:
        recent_releases.append(line)
    elif "fix(" in line or "ux(" in line:
        # Extract unique fix types from commit messages in log
        m = re.search(r'(?:fix|ux)\([^)]+\):\s*(.+?)(?:\s*--|\s*file:)', line)
        if m:
            unique_fix_types.add(m.group(1).strip())

skills_per_branch = {}
fixes_per_branch = {}
learning_cycles_per_branch = {}
for b, p in AWS_PROFILES.items():
    skills = p.get("skill_library", [])
    if skills:
        skills_per_branch[b] = len(skills)
    fixes = p.get("successful_fixes", [])
    if fixes:
        fixes_per_branch[b] = len(fixes)
    cycles = p.get("total_learning_cycles", 0)
    if cycles:
        learning_cycles_per_branch[b] = cycles

no_build_check = [b for b, p in AWS_PROFILES.items() if not p.get("build_check")]
no_cf_domain = ["dash", "wave", "subrepos"]
stale = [b for b, c in total_releases.items() if c < 3 and b != "greathousefarm"]
unbalanced = [b for b, c in total_releases.items() if c > 100]

summary = {
    "total_releases": total_count,
    "unique_branches_released": len(total_releases),
    "rotation_index": rotation_idx,
    "fix_rotation": fix_rotation,
    "fix_sources": fix_sources,
    "unique_fix_types_count": len(unique_fix_types),
    "unique_fix_types_sample": sorted(list(unique_fix_types))[:20],
    "skills_per_branch": skills_per_branch,
    "fixes_per_branch": fixes_per_branch,
    "learning_cycles_per_branch": learning_cycles_per_branch,
    "recent_releases_count": len(recent_releases),
    "branches_with_issues": {
        "no_build_check": no_build_check,
        "no_cf_domain": no_cf_domain,
        "stale_branches": stale,
        "unbalanced": unbalanced,
    },
    "previous_total": 0,
}
if LOCAL_STATE_FILE.exists():
    ls = json.loads(LOCAL_STATE_FILE.read_text())
    summary["previous_total"] = sum(ls.get("total_releases", {}).values())

print(json.dumps(summary, indent=2))
