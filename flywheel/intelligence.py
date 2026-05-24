#!/usr/bin/env python3
"""
Flywheel Agent v2 — per-branch profile with self-learning.
Each branch has a profile in agent/profiles.json defining:
  - LLM rotation (financecheque.uk first, localhost proxy fallback)
  - Learned patterns, skills, reflections
  - Successful/failed fix history
Usage: intelligence.py --branch <name> --type bug|ux [--learn-after <fix_json>]
"""
import argparse, json, os, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone

FCUK_DIR = Path.home() / ".fcukproxy"
AGENT_DIR = FCUK_DIR / "agent"
PROFILES_FILE = AGENT_DIR / "profiles.json"
ENV_FILE = FCUK_DIR / ".env"
CONFIG_FILE = FCUK_DIR / "machine.json"

ENV_KEYS = {}
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            ENV_KEYS[k.strip()] = v.strip()
for key in ("OPENAI_API_KEY","ANTHROPIC_API_KEY","GEMINI_API_KEY",
            "OPENROUTER_API_KEY","DEEPSEEK_API_KEY","NVAPI_KEY"):
    if key in os.environ:
        ENV_KEYS[key] = os.environ[key]

MACHINE_ID = ""
if CONFIG_FILE.exists():
    try:
        MACHINE_ID = json.loads(CONFIG_FILE.read_text()).get("machine_id", "")
    except Exception:
        pass

# ── Profile helpers ───────────────────────────────────────────────────────────

def load_profiles():
    if PROFILES_FILE.exists():
        try:
            return json.loads(PROFILES_FILE.read_text())
        except Exception:
            pass
    return {}

def save_profiles(profiles):
    PROFILES_FILE.write_text(json.dumps(profiles, indent=2))

def get_profile(branch):
    profiles = load_profiles()
    return profiles.get(branch)

def save_profile(branch, profile):
    profiles = load_profiles()
    profiles[branch] = profile
    save_profiles(profiles)

# ── Context loading ───────────────────────────────────────────────────────────

def load_branch_context(branch):
    ctx = {"branch": branch}
    for name, path in [("soul", AGENT_DIR / "soul.md"),
                       ("manifest", AGENT_DIR / "manifest.md"),
                       ("memory", AGENT_DIR / "memory.md"),
                       ("branch_context", AGENT_DIR / "branches" / f"{branch}.md")]:
        if path.exists():
            ctx[name] = path.read_text()
        else:
            ctx[name] = ""
    m = re.search(r'## Category\s*\n(\S+)', ctx.get("branch_context", ""))
    ctx["category"] = m.group(1) if m else "unknown"
    m = re.search(r'## URL\s*\n(\S+)', ctx.get("branch_context", ""))
    ctx["url"] = m.group(1) if m else "unknown"
    m = re.search(r'## Stack\s*\n(.+?)(?=\n## |\Z)', ctx.get("branch_context", ""), re.DOTALL)
    ctx["stack"] = m.group(1).strip() if m else "unknown"
    m = re.search(r'## Known Issues\s*\n(.+?)(?=\n## |\Z)', ctx.get("branch_context", ""), re.DOTALL)
    ctx["issues"] = m.group(1).strip() if m else "unknown"
    m = re.search(r'## Past Fixes\s*\n(.+?)(?=\n## |\Z)', ctx.get("branch_context", ""), re.DOTALL)
    ctx["past_fixes"] = m.group(1).strip() if m else "(none)"
    return ctx

# ── Prompt builder ────────────────────────────────────────────────────────────

def build_prompt(branch, fix_type, ctx, profile):
    profile = profile or {}
    fix_type_pretty = "BUG" if fix_type == "bug" else "UX IMPROVEMENT"

    # Inject profile knowledge into prompt
    learned = profile.get("learned_patterns", [])
    skills = profile.get("skill_library", [])
    reflections = profile.get("reflections", [])
    branch_knowledge = profile.get("branch_knowledge", "")
    successful_fixes = profile.get("successful_fixes", [])

    knowledge_section = ""
    if learned:
        knowledge_section += "\n## Learned Patterns (from past fixes)\n"
        for p in learned[-10:]:
            knowledge_section += f"- {p.get('pattern', '')}: {p.get('detail', '')}\n"
    if skills:
        knowledge_section += "\n## Skill Library (reusable fix techniques)\n"
        for s in skills[-10:]:
            knowledge_section += f"- {s.get('name', '')}: {s.get('description', '')}\n"
    if reflections:
        knowledge_section += "\n## Past Reflections\n"
        for r in reflections[-5:]:
            knowledge_section += f"- {r.get('lesson', '')}\n"
    if branch_knowledge:
        knowledge_section += f"\n## Branch Knowledge\n{branch_knowledge[:1000]}\n"
    if successful_fixes:
        knowledge_section += "\n## Recently Applied Fixes\n"
        for f in successful_fixes[-5:]:
            knowledge_section += f"- {f.get('commit_message', '')}: {f.get('bug_description', '')[:100]}\n"

    if fix_type == "bug":
        task = "Find the single most impactful BUG in the deployed website's source code.\n- FIRST visit the live URL in your browser and visually inspect the site\n- Take a screenshot, check console for JS errors, test navigation, verify forms\n- Check mobile layout, fonts, images, links, meta tags, structured data\n- Must affect real users or SEO\n- Include SEO improvements as bug fixes\n- Fix must be a simple string replacement in one file\n- Output ONLY valid JSON no markdown"
        system = "You are a senior software engineer improving websites. Find the biggest real bug. Return ONLY JSON: {\"file_path\": \"relative/path\", \"bug_description\": \"why this matters\", \"old_string\": \"exact existing text\", \"new_string\": \"replacement text\", \"commit_message\": \"fix(branch): description\"}. No explanation, no markdown."
    else:
        task = "Find the single most impactful UX IMPROVEMENT for the deployed website.\n- FIRST visit the live URL in your browser and visually inspect the site\n- Take a screenshot, check mobile responsiveness, navigation, forms, load time\n- Evaluate: layout, typography, colour contrast, tap targets, animations, accessibility\n- Must make the website easier or more pleasant to use\n- Fix must be a simple string replacement in one file\n- Output ONLY valid JSON no markdown"
        system = "You are a senior UX engineer. Find the biggest UX improvement. Return ONLY JSON: {\"file_path\": \"relative/path\", \"bug_description\": \"why this improves UX\", \"old_string\": \"exact existing text\", \"new_string\": \"replacement text\", \"commit_message\": \"ux(branch): description\"}. No explanation, no markdown."

    prompt = f"""## Website: {ctx['url']}
## Branch: {branch}
## Category: {ctx['category']}
## Stack: {ctx['stack']}

## Purpose
{ctx.get('branch_context', '')[:2000]}

## Known Issues
{ctx['issues']}

## Past Fixes Applied
{ctx['past_fixes']}
{knowledge_section}

## Task
{task}

## Live Website
The branch website is deployed and live at: {ctx['url']}
You can VISIT this URL in your browser to visually inspect the site.
Use the deployed website as your primary source of truth.

Remember: the code is at /home/ubuntu/datro. All website files now live under static/{branch}/. Find a real, verifiable bug in a file that exists. old_string MUST be exact text found in the file.
"""
    return system, prompt

# ── LLM query functions ───────────────────────────────────────────────────────

def query_parent_proxy(prompt, system, url_override=None):
    url = url_override or "https://www.financecheque.uk/api/proxy"
    payload = json.dumps({"message": f"{system}\n\n{prompt}", "chat_only": True})
    cmd = ["curl", "-sf", "--max-time", "60", "-X", "POST", f"{url}?action=chat",
           "-H", "Content-Type: application/json"]
    if MACHINE_ID:
        cmd += ["-H", f"X-Machine-ID: {MACHINE_ID}"]
    cmd += ["-d", payload]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=70)
        if r.returncode == 0 and r.stdout:
            data = json.loads(r.stdout)
            content = data.get("reply", "") or data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content and not content.startswith("Echo:"):
                return content
    except Exception:
        pass
    return None

def query_local_proxy(prompt, system, url_override=None):
    url = url_override or "http://localhost:6000/v1/chat/completions"
    payload = json.dumps({"model": "big-pickle", "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ], "max_tokens": 4096, "temperature": 0.3}).encode()
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content
    except Exception:
        return None

def query_child_proxy(prompt, system, url_override=None):
    url = url_override or "http://172.31.29.216:4001"
    payload = json.dumps({"message": f"{system}\n\n{prompt}", "chat_only": True})
    cmd = ["curl", "-sf", "--max-time", "60", "-X", "POST", f"{url}/chat",
           "-H", "Content-Type: application/json", "-d", payload]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=70)
        if r.returncode == 0 and r.stdout:
            data = json.loads(r.stdout)
            reply = data.get("reply", "")
            if reply:
                return reply
    except Exception:
        pass
    return None

def query_nvidia(prompt, system):
    api_key = ENV_KEYS.get("NVAPI_KEY")
    if not api_key or api_key == "PLACEHOLDER":
        return None
    payload = json.dumps({"model": "meta/llama-3.1-8b-instruct", "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ], "max_tokens": 4096, "temperature": 0.3}).encode()
    req = urllib.request.Request("https://integrate.api.nvidia.com/v1/chat/completions", data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content
    except Exception:
        return None

def query_openrouter(prompt, system):
    api_key = ENV_KEYS.get("OPENROUTER_API_KEY")
    if not api_key or api_key == "PLACEHOLDER":
        return None
    payload = json.dumps({"model": "openai/gpt-4o-mini", "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ], "max_tokens": 4096, "temperature": 0.3}).encode()
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("HTTP-Referer", "https://www.financecheque.uk")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content
    except Exception:
        return None

def query_gemini(prompt, system):
    key = ENV_KEYS.get("GEMINI_API_KEY")
    if not key or key == "PLACEHOLDER":
        return None
    payload = json.dumps({"contents": [{"role": "user", "parts": [{"text": f"{system}\n\n{prompt}"}]}]}).encode()
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
        data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return text
    except Exception:
        return None

def query_deepseek(prompt, system):
    key = ENV_KEYS.get("DEEPSEEK_API_KEY")
    if not key or key == "PLACEHOLDER":
        return None
    payload = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ], "max_tokens": 4096, "temperature": 0.3}).encode()
    req = urllib.request.Request("https://api.deepseek.com/v1/chat/completions", data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content
    except Exception:
        return None

LLM_HANDLERS = {
    "financecheque": lambda p, s, **kw: query_parent_proxy(p, s, kw.get("url")),
    "local_proxy":   lambda p, s, **kw: query_local_proxy(p, s, kw.get("url")),
    "child_proxy":   lambda p, s, **kw: query_child_proxy(p, s, kw.get("url")),
    "nvidia":        lambda p, s, **kw: query_nvidia(p, s),
    "openrouter":    lambda p, s, **kw: query_openrouter(p, s),
    "gemini":        lambda p, s, **kw: query_gemini(p, s),
    "deepseek":      lambda p, s, **kw: query_deepseek(p, s),
}

# ── Profile learning ──────────────────────────────────────────────────────────

def learn_from_fix(branch, profile, fix, fix_type, source_name, validated):
    """Update profile with learnings from a fix."""
    if not profile:
        return
    ts = datetime.now(timezone.utc).isoformat()

    # Record the fix
    record = {
        "timestamp": ts,
        "type": fix_type,
        "source": source_name,
        "validated": validated,
        "file_path": fix.get("file_path", ""),
        "bug_description": fix.get("bug_description", ""),
        "commit_message": fix.get("commit_message", ""),
    }
    if validated:
        profile.setdefault("successful_fixes", []).append(record)
    else:
        profile.setdefault("failed_fixes", []).append(record)

    # Extract pattern from the fix
    fp = fix.get("file_path", "")
    if fp:
        ext = os.path.splitext(fp)[1]
        pattern_desc = f"Modified {ext} file: {os.path.basename(fp)}"
        # Avoid duplicate patterns
        existing = [p.get("pattern") for p in profile.get("learned_patterns", [])]
        if pattern_desc not in existing:
            profile.setdefault("learned_patterns", []).append({
                "pattern": pattern_desc,
                "detail": fix.get("bug_description", "")[:200],
                "discovered": ts
            })

    # Extract skill from validated fix
    if validated and fix.get("commit_message"):
        skill_name = fix["commit_message"].split(":")[-1].strip()[:60]
        existing_skills = [s.get("name") for s in profile.get("skill_library", [])]
        if skill_name and skill_name not in existing_skills:
            profile.setdefault("skill_library", []).append({
                "name": skill_name,
                "description": fix.get("bug_description", "")[:200],
                "file_type": os.path.splitext(fix.get("file_path", ""))[1],
                "discovered": ts,
                "use_count": 1
            })

    # Add reflection
    reflection = f"{'Validated' if validated else 'Failed'} {fix_type} via {source_name}: {fix.get('bug_description','')[:100]}"
    profile.setdefault("reflections", []).append({
        "lesson": reflection,
        "timestamp": ts,
        "outcome": "success" if validated else "failure"
    })

    # Update branch knowledge
    knowledge_line = f"[{ts}] {fix.get('commit_message','')} — {fix.get('bug_description','')[:100]}"
    existing_knowledge = profile.get("branch_knowledge", "")
    profile["branch_knowledge"] = (existing_knowledge + "\n" + knowledge_line).strip()

    profile["total_learning_cycles"] = profile.get("total_learning_cycles", 0) + 1

    # Cap storage to prevent bloat
    for key in ["learned_patterns", "skill_library", "reflections"]:
        if len(profile.get(key, [])) > 50:
            profile[key] = profile[key][-50:]
    if len(profile.get("successful_fixes", [])) > 100:
        profile["successful_fixes"] = profile["successful_fixes"][-100:]
    if len(profile.get("failed_fixes", [])) > 50:
        profile["failed_fixes"] = profile["failed_fixes"][-50:]
    if len(profile.get("branch_knowledge", "")) > 10000:
        profile["branch_knowledge"] = profile["branch_knowledge"][-10000:]

    save_profile(branch, profile)

# ── JSON / validation ─────────────────────────────────────────────────────────

def extract_json_fix(text):
    text = re.sub(r'```(?:json)?\s*\n?', '', text)
    text = text.strip()
    if text.endswith("```"):
        text = text[:-3]
    for pattern in [
        r'\{[^{}]*"file_path"[^{}]*"old_string"[^{}]*\}',
        r'\{[^{}]*"old_string"[^{}]*"file_path"[^{}]*\}',
        r'\{[^{}]*"file_path"[^{}]*"bug_description"[^{}]*\}',
    ]:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    try:
        return json.loads(text)
    except Exception:
        return None

def validate_fix(fix, repo_dirs):
    fp = fix.get("file_path", "")
    if not fp:
        return None
    for rd in repo_dirs:
        full = rd / fp
        if full.exists():
            fix["file_path"] = str(full)
            old = fix.get("old_string", "")
            if old and old in full.read_text():
                return fix
            if not old:
                return fix
    return None

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch", required=True)
    parser.add_argument("--type", choices=["bug", "ux"], required=True)
    parser.add_argument("--pass-number", type=int, default=1)
    parser.add_argument("--learn-after", help="JSON fix to learn from")
    args = parser.parse_args()

    # If --learn-after, just update the profile and exit
    if args.learn_after:
        profile = get_profile(args.branch)
        if not profile:
            print(f"[intel] No profile for {args.branch}, skipping learning", file=sys.stderr)
            return
        try:
            fix = json.loads(args.learn_after)
        except Exception:
            print(f"[intel] Invalid learn-after JSON", file=sys.stderr)
            return
        learn_from_fix(args.branch, profile, fix, args.type, "manual", True)
        print(f"[intel] Learned from fix for {args.branch}", file=sys.stderr)
        return

    ctx = load_branch_context(args.branch)
    profile = get_profile(args.branch)

    # Load profile's LLM rotation
    if profile and profile.get("llm_rotation"):
        rotation = list(profile["llm_rotation"])
        start_idx = profile.get("rotation_index", 0) % len(rotation)
    else:
        rotation = [
            {"name": "financecheque", "url": "https://www.financecheque.uk/api/proxy", "type": "parent"},
            {"name": "local_proxy", "url": "http://localhost:6000/v1/chat/completions", "type": "local"},
            {"name": "child_proxy", "url": "http://172.31.29.216:4001", "type": "child"},
            {"name": "nvidia", "type": "nvidia"},
            {"name": "openrouter", "type": "openrouter"},
        ]
        start_idx = 0

    system, prompt = build_prompt(args.branch, args.type, ctx, profile)
    repo_dirs = [Path.home() / "datro", Path.home() / "datro-financecheque"]

    # Try each LLM in rotation order
    for i in range(len(rotation)):
        idx = (start_idx + i) % len(rotation)
        entry = rotation[idx]
        name = entry["name"]
        handler = LLM_HANDLERS.get(name)
        if not handler:
            print(f"[intel] unknown LLM source: {name}", file=sys.stderr)
            continue

        print(f"[intel] trying {name} (rotation slot {idx})...", file=sys.stderr)
        try:
            url = entry.get("url", "")
            result = handler(prompt, system, url=url) if url else handler(prompt, system)
        except Exception as e:
            print(f"[intel] {name} error: {e}", file=sys.stderr)
            continue

        if result:
            fix = extract_json_fix(result)
            if fix:
                validated = validate_fix(fix, repo_dirs)
                if validated:
                    print(f"[intel] {name} validated fix: {validated['file_path']}", file=sys.stderr)
                    # Learn from success
                    if profile:
                        learn_from_fix(args.branch, profile, validated, args.type, name, True)
                    # Advance rotation index for next time
                    if profile:
                        next_idx = (start_idx + 1) % len(rotation)
                        profile["rotation_index"] = next_idx
                        save_profile(args.branch, profile)
                    print(json.dumps(validated))
                    return
                else:
                    print(f"[intel] {name} fix failed validation", file=sys.stderr)
                    # Learn from failure too
                    if profile and fix:
                        learn_from_fix(args.branch, profile, fix, args.type, name, False)
            else:
                print(f"[intel] {name} response had no parseable JSON", file=sys.stderr)

    # Signal pool fallback
    sys.exit(42)

if __name__ == "__main__":
    main()
