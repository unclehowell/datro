#!/usr/bin/env python3
"""
Flywheel Agent v3 — tool-based edits, self-correction, per-branch profiles.
Supports multiple edit tools: sed, patch, write, linter, format.
Self-corrects by feeding build errors back to the LLM.
Atomic profile saves to prevent state corruption.
"""
import argparse, json, os, re, subprocess, sys, urllib.request, urllib.error, tempfile
from pathlib import Path
from datetime import datetime, timezone

FCUK_DIR = Path.home() / ".fcukproxy"
AGENT_DIR = FCUK_DIR / "agent"
PROFILES_FILE = AGENT_DIR / "profiles.json"
ENV_FILE = FCUK_DIR / ".env"
CONFIG_FILE = FCUK_DIR / "machine.json"
STATE_FILE = FCUK_DIR / "release-state.json"

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

# ── Atomic file helpers ─────────────────────────────────────────────────────────

def atomic_write(path, data):
    tmp = path.with_suffix(".tmp." + os.urandom(4).hex())
    tmp.write_text(data)
    tmp.replace(path)

def atomic_json_write(path, obj):
    tmp = path.with_suffix(".tmp." + os.urandom(4).hex())
    tmp.write_text(json.dumps(obj, indent=2))
    tmp.replace(path)

# ── Profile helpers ───────────────────────────────────────────────────────────

def load_profiles():
    if PROFILES_FILE.exists():
        try:
            return json.loads(PROFILES_FILE.read_text())
        except Exception:
            pass
    return {}

def save_profiles(profiles):
    atomic_json_write(PROFILES_FILE, profiles)

def get_profile(branch):
    return load_profiles().get(branch)

def save_profile(branch, profile):
    profiles = load_profiles()
    profiles[branch] = profile
    save_profiles(profiles)

# ── Atomic state helpers ─────────────────────────────────────────────────────

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {}

def save_state(state):
    atomic_json_write(STATE_FILE, state)

def get_state_val(key):
    state = load_state()
    keys = key.split(".")
    for k in keys:
        if isinstance(state, dict):
            state = state.get(k)
        else:
            return None
    return state

def set_state_val(key, value):
    state = load_state()
    keys = key.split(".")
    target = state
    for k in keys[:-1]:
        target = target.setdefault(k, {})
    target[keys[-1]] = value
    save_state(state)

# ── Daily uniqueness tracking ─────────────────────────────────────────────────

DAILY_FILE = AGENT_DIR / "daily-unique.json"

def today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def load_daily():
    if DAILY_FILE.exists():
        try:
            data = json.loads(DAILY_FILE.read_text())
            if data.get("date") == today_str():
                return data
        except Exception:
            pass
    return {"date": today_str(), "bugs": [], "features": []}

def save_daily(data):
    data["date"] = today_str()
    atomic_json_write(DAILY_FILE, data)

def record_daily_fix(description, fix_type="bug"):
    data = load_daily()
    key = "features" if fix_type == "ux" else "bugs"
    if description not in data[key]:
        data[key].append(description)
        save_daily(data)
        return True
    return False

# ── Context loading ───────────────────────────────────────────────────────────

def scan_branch_files(repo_path, max_files=5, max_lines=80):
    """Scan branch checkout for HTML/CSS/JS files and return name + excerpt."""
    if not repo_path or not Path(repo_path).exists():
        return "No files available (repo_path not provided)."
    rp = Path(repo_path)
    static_dir = rp / "static"
    if static_dir.exists():
        for child in sorted(static_dir.iterdir()):
            if child.is_dir():
                rp = child
                break
    excerpts = []
    for ext in ("*.html", "*.css", "*.js", "*.json"):
        for f in sorted(rp.glob(ext))[:max_files]:
            try:
                lines = f.read_text().splitlines()
                excerpt = "\n".join(lines[:max_lines])
                excerpts.append(f"--- {f.relative_to(Path(repo_path))} ({len(lines)} lines) ---\n{excerpt}")
            except Exception:
                pass
    if not excerpts:
        for f in sorted(rp.glob("**/*.html"))[:max_files]:
            try:
                lines = f.read_text().splitlines()
                excerpt = "\n".join(lines[:max_lines])
                excerpts.append(f"--- {f.relative_to(Path(repo_path))} ({len(lines)} lines) ---\n{excerpt}")
            except Exception:
                pass
    return "\n\n".join(excerpts) if excerpts else "No readable files found in branch checkout."

def load_branch_context(branch, repo_path=""):
    ctx = {"branch": branch}
    for name, path in [("soul", AGENT_DIR / "soul.md"),
                       ("manifest", AGENT_DIR / "manifest.md"),
                       ("memory", AGENT_DIR / "memory.md"),
                       ("branch_context", AGENT_DIR / "branches" / f"{branch}.md"),
                       ("aws_supervisor", AGENT_DIR / "aws-supervisor.md")]:
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
    master_path = AGENT_DIR / "masters" / f"{branch}.md"
    ctx["master_plan"] = master_path.read_text() if master_path.exists() else ""
    ctx["repo_path"] = repo_path
    ctx["file_excerpts"] = scan_branch_files(repo_path) if repo_path else ""
    return ctx

# ── Prompt builder ────────────────────────────────────────────────────────────

TOOL_HELP = """
Available tools:
- "sed": string replacement. Requires file_path, old_string, new_string.
- "patch": unified diff. Requires file_path, diff (git-format patch).
- "write": overwrite entire file. Requires file_path, new_content.
- "linter": run linter on file. Requires file_path, optionally linter_command.
- "format": run formatter on file. Requires file_path.

Output ONLY valid JSON with a "tool" field. No explanation, no markdown.
"""

META_TOOL_HELP = """
Available tools:
- "sed": string replacement. Requires file_path, old_string, new_string.
- "patch": unified diff. Requires file_path, diff (git-format patch).
- "write": overwrite entire file. Requires file_path, new_content.

Output ONLY valid JSON. No explanation, no markdown.
"""

def build_meta_prompt(branch, ctx, profile, error_feedback=""):
    profile = profile or {}
    learned = profile.get("learned_patterns", [])
    skills = profile.get("skill_library", [])
    reflections = profile.get("reflections", [])
    successful_fixes = profile.get("successful_fixes", [])
    branch_knowledge = profile.get("branch_knowledge", "")

    knowledge_section = ""
    if learned:
        knowledge_section += "\n## Learned Patterns\n"
        for p in learned[-10:]:
            knowledge_section += f"- {p.get('pattern', '')}: {p.get('detail', '')}\n"
    if skills:
        knowledge_section += "\n## Skill Library\n"
        for s in skills[-10:]:
            knowledge_section += f"- {s.get('name', '')}: {s.get('description', '')}\n"
    if reflections:
        knowledge_section += "\n## Past Reflections\n"
        for r in reflections[-5:]:
            knowledge_section += f"- {r.get('lesson', '')}\n"
    if branch_knowledge:
        knowledge_section += f"\n## Branch Knowledge\n{branch_knowledge[:1500]}\n"
    if successful_fixes:
        knowledge_section += "\n## Past Meta-Suggestions\n"
        for f in successful_fixes[-5:]:
            knowledge_section += f"- {f.get('commit_message', '')}: {f.get('bug_description', '')[:150]}\n"

    error_section = ""
    if error_feedback:
        error_section = f"\n## PREVIOUS FIX FAILED\n{error_feedback[:2000]}\nPlease provide a CORRECTED fix.\n"

    task = """Analyze the AWS flywheel worker and suggest ONE improvement to the flywheel code.
The system consists of:
- multi-branch-release.sh (bash) — the hourly release runner
- intelligence.py (python) — the AI agent
- agent/profiles.json — per-branch learning state
- agent/branches/*.md — branch context
- agent/masters/*.md — per-branch master plans (vision, roadmap, compliance requirements)
- agent/memory.md — cross-branch learnings
- agent/aws-supervisor.md — coaching context

Key recent changes:
1. Master plans added for all 21 branches with phased roadmaps
2. AI prompt now includes master plan — AI is directed to implement highest-priority roadmap items
3. Compliance pool functions: fix_privacy_policy, fix_terms_service, fix_contact_page, fix_blog_launch
4. UX pool functions: ux_cookie_consent, ux_social_links, ux_footer_legal
5. Blog post generation after each release with RSS feed
6. ALL branches now have strategic visions — no more directionless tweaks

Your job: ensure these new systems work correctly and improve release quality.
Focus on: fix diversity, master plan compliance, blog generation, compliance page creation, learning from releases.

Output a JSON fix using one of the available tools that DIRECTLY edits a flywheel file.
The file_path must be one of: flywheel/multi-branch-release.sh, flywheel/intelligence.py, flywheel/agent/profiles.json, flywheel/agent/branches/aws.md, flywheel/agent/masters/*.md, flywheel/agent/aws-supervisor.md, flywheel/meta-review.sh"""

    system = """You are a senior engineering director coaching an autonomous flywheel towards strategic excellence.
Your student is an AWS server running 24/7 releases across 21 branches, each with a master plan and vision.
Analyze the data, identify the SINGLE MOST IMPACTFUL improvement to make releases more meaningful.
Ensure branches progress through their master plan roadmaps (compliance → content → growth).
Fix must be in a flywheel/ file. Return ONLY valid JSON. No explanation, no markdown."""

    prompt = f"""## AWS Flywheel State
{ctx.get('branch_context', '')[:3000]}

## AWS Supervisor Soul
{ctx.get('aws_supervisor', '')[:2000]}

## Knowledge & History
{knowledge_section}
{error_section}

## Task
{task}

## Available Tools
{META_TOOL_HELP}

## Output Format
For "sed": {{"tool":"sed","file_path":"flywheel/multi-branch-release.sh","old_string":"...","new_string":"...","bug_description":"why this improves the flywheel","commit_message":"meta: description"}}
For "patch": {{"tool":"patch","file_path":"flywheel/intelligence.py","diff":"...","bug_description":"...","commit_message":"meta: description"}}
For "write": {{"tool":"write","file_path":"flywheel/agent/branches/aws.md","new_content":"...","bug_description":"...","commit_message":"meta: description"}}

Remember: flywheel/ files are on the cnei branch. old_string MUST be exact text found in the file.
"""
    return system, prompt


def build_prompt(branch, fix_type, ctx, profile, error_feedback=""):
    profile = profile or {}

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

    constraint_section = ""
    if ctx.get("constraint", ""):
        constraint_section = f"\n## CONSTRAINT — DO NOT IGNORE\n{ctx['constraint']}\n"

    cornerstone_checklists = {
        "ecommerce": """- [ ] JSON-LD structured data (Organization, WebSite, Product)
- [ ] Open Graph / Twitter Card meta tags for social sharing
- [ ] Meta description tag (unique, keyword-rich, <160 chars)
- [ ] Viewport meta tag for mobile responsiveness
- [ ] Favicon (multi-size: 16, 32, apple-touch-icon)
- [ ] Signup / registration / login flow
- [ ] Payment integration (Stripe, PayPal checkout)
- [ ] Cookie consent banner
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Trust signals (testimonials, reviews, guarantees, SSL badge)
- [ ] Clear CTA buttons (primary action above the fold)
- [ ] Analytics (Google Analytics, Plausible, etc.)
- [ ] Sitemap.xml / robots.txt
- [ ] Navigation: header menu, footer with links, breadcrumbs
- [ ] 404 page with navigation back to main content
- [ ] Social proof / case studies / partner logos
- [ ] Color contrast meets WCAG AA (4.5:1 ratio)
- [ ] All images have alt text for accessibility/SEO
- [ ] Contact form or contact information prominently displayed""",

        "community": """- [ ] JSON-LD structured data (Organization, WebSite)
- [ ] Open Graph / Twitter Card meta tags for social sharing
- [ ] Meta description tag
- [ ] Viewport meta + responsive design
- [ ] Favicon
- [ ] Signup / membership registration
- [ ] Navigation with clear information architecture
- [ ] Cookie consent banner
- [ ] Privacy policy
- [ ] Contact form or contact details
- [ ] Clear mission/statement on homepage
- [ ] Calls-to-action (donate, join, volunteer, learn more)
- [ ] Analytics
- [ ] Sitemap.xml / robots.txt
- [ ] Social media links / sharing buttons
- [ ] Mobile-friendly layout (test on small screens)
- [ ] Heading hierarchy (h1 → h2 → h3 correctly ordered)
- [ ] Image alt text for accessibility
- [ ] Footer with links, copyright, legal info
- [ ] 404 page""",

        "platform": """- [ ] JSON-LD structured data (WebApplication, SoftwareApp)
- [ ] Open Graph / Twitter Card meta tags
- [ ] Meta description tag
- [ ] Viewport meta + mobile responsiveness
- [ ] Favicon + PWA manifest.json + service worker
- [ ] User authentication (signup, login, password reset)
- [ ] Subscription / payment integration
- [ ] API documentation or developer portal link
- [ ] Cookie consent banner
- [ ] Privacy policy + Terms of service
- [ ] Dashboard / user account area
- [ ] Onboarding flow for new users
- [ ] Loading states, error states, empty states
- [ ] Keyboard navigation accessibility
- [ ] Analytics
- [ ] Color contrast + focus indicators
- [ ] Performance: lazy loading, code splitting
- [ ] 404 page
- [ ] Automated tests or CI status badge
- [ ] Status page / uptime monitoring""",

        "documentation": """- [ ] JSON-LD structured data (WebSite, TechArticle)
- [ ] Open Graph / Twitter Card meta tags
- [ ] Meta description tag
- [ ] Viewport meta + responsive layout
- [ ] Favicon
- [ ] Search functionality
- [ ] Table of contents / sidebar navigation
- [ ] Breadcrumb navigation
- [ ] Cookie consent banner
- [ ] Privacy policy
- [ ] "Back to top" button on long pages
- [ ] Print-friendly styles
- [ ] Code syntax highlighting
- [ ] Last-updated date on pages
- [ ] Analytics
- [ ] Sitemap.xml / robots.txt
- [ ] Mobile-friendly reader mode
- [ ] Heading hierarchy (h1 → h2 → h3)
- [ ] Internal linking between related docs
- [ ] 404 page with search""",

        "meta": """- [ ] Self-review log is populated and accurate
- [ ] Fix source tracking (AI vs POOL vs FALLBACK) is working
- [ ] Profiles show increasing learning cycles
- [ ] Failed fixes are being analyzed for pattern improvement
- [ ] Sync-back from AWS is capturing all learnings""",

        "unknown": """- [ ] JSON-LD structured data (WebSite)
- [ ] Open Graph / Twitter Card meta tags
- [ ] Meta description tag
- [ ] Viewport meta + mobile responsiveness
- [ ] Favicon
- [ ] Cookie consent banner
- [ ] Privacy policy
- [ ] Analytics
- [ ] Clear heading hierarchy (h1 → h2 → h3)
- [ ] Navigation and footer
- [ ] Image alt text
- [ ] Sitemap.xml / robots.txt
- [ ] 404 page
- [ ] Mobile-friendly layout
- [ ] Color contrast meets WCAG AA""",
    }
    category_aliases = {
        "knowledge": "documentation",
        "advocacy": "community",
        "archive": "documentation",
        "hub": "community",
        "tool": "meta",
        "docs": "documentation",
    }
    category = category_aliases.get(ctx.get("category", "unknown"), ctx.get("category", "unknown"))
    checklist = cornerstone_checklists.get(category, cornerstone_checklists["unknown"])

    file_excerpts = ctx.get("file_excerpts", "")
    master_plan_text = ctx.get("master_plan", "")
    master_items = []
    if master_plan_text:
        for line in master_plan_text.splitlines():
            stripped = line.strip()
            if stripped.startswith("- [ ]"):
                master_items.append(stripped)
    master_todo = "\n".join(
        f"{i+1}. {item[5:]}" for i, item in enumerate(master_items[:15])
    ) if master_items else "(All master plan items checked — improve quality of existing features)"

    if fix_type == "bug":
        task = f"""## Branch Files
{file_excerpts[:500]}

## Task
Read the Concrete Todos. Pick the HIGHEST priority unchecked item.
Implement using 'write' (new file) or 'sed' (edit existing).

## Rules
- Do NOT fix blank lines or remove console.log/comments
- This MUST be a real missing feature — NOT blank line removal
- Output ONLY valid JSON"""
        system_prefix = "You are a senior full-stack engineer. Execute the master plan. Output ONLY valid JSON."
    else:
        task = f"""## Branch Files
{file_excerpts[:500]}

## Task
Add ONE novel feature this website is missing.
Examples: cookie consent, hamburger menu, skip-link, dark mode, search, breadcrumbs, RSS, chatbot.

## Rules
- Must be a NEW feature (check files above)
- Output ONLY valid JSON"""
        system_prefix = "You are a senior UX engineer. Add one novel feature. Output ONLY valid JSON."

    error_section = ""
    if error_feedback:
        error_section = f"\n## PREVIOUS FIX FAILED\n{error_feedback[:2000]}\nProvide a CORRECTED fix.\n"

    daily_section = ""
    daily_fixes = ctx.get("daily_fixes", "")
    daily_features = ctx.get("daily_features", "")
    if daily_fixes:
        daily_section += f"\n## TODAY'S ALREADY-APPLIED BUG FIXES (do NOT repeat)\n{daily_fixes}\n"
    if daily_features:
        daily_section += f"\n## TODAY'S ALREADY-APPLIED FEATURES (do NOT repeat)\n{daily_features}\n"
    if daily_section:
        daily_section += "\nYour fix MUST be unique — NOT present in any of the lists above.\n"

    prompt = f"""## Website: {ctx['url']}
## Branch: {branch}
## Category: {ctx['category']}

## Purpose
{ctx.get('branch_context', '')[:300]}

## Todos
{master_todo[:600]}

{knowledge_section[:400]}

{constraint_section[:300]}
{daily_section[:300]}
{error_section[:300]}

## Task
{task[:1200]}

## Format
tool=sed|write|patch file_path=relative path old_string+new_string|new_content bug_description commit_message"""
    system = f"{system_prefix} Return ONLY valid JSON."
    # Enforce total prompt length under proxy limit (2000 chars)
    combined = system + "\n\n" + prompt
    if len(combined) > 1900:
        prompt = prompt[:1800]
    return system, prompt

# ── LLM query functions ───────────────────────────────────────────────────────

def query_parent_proxy(prompt, system, url_override=None):
    url = url_override or "https://www.financecheque.uk/api/proxy"
    payload = json.dumps({"message": f"{system}\n\n{prompt}", "chat_only": True})
    cmd = ["curl", "-sf", "--max-time", "120", "-X", "POST", f"{url}?action=chat",
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

# ── Fix application (tool based) ──────────────────────────────────────────────

def apply_fix(fix, repo_dirs):
    """Apply a tool-based fix. Returns (success, error_message)."""
    tool = fix.get("tool", "sed")
    fp = fix.get("file_path", "")
    if not fp:
        return False, "no file_path"

    # Resolve file path
    full_path = None
    for rd in repo_dirs:
        candidate = rd / fp
        if candidate.exists():
            full_path = candidate
            break

    if tool in ("write",):
        # write tool: file doesn't need to exist
        for rd in repo_dirs:
            candidate = rd / fp
            if candidate.parent.exists():
                full_path = candidate
                break
    if not full_path:
        return False, f"file not found: {fp}"

    fix["file_path"] = str(full_path)

    try:
        if tool == "sed":
            old = fix.get("old_string", "")
            new = fix.get("new_string", "")
            if not old:
                return False, "sed requires old_string"
            content = full_path.read_text()
            if old not in content:
                return False, f"old_string not found in {fp}"
            new_content = content.replace(old, new, 1)
            if new_content == content:
                return False, "sed produced no change"
            full_path.write_text(new_content)
            return True, ""

        elif tool == "patch":
            diff = fix.get("diff", "")
            if not diff:
                return False, "patch requires diff"
            p = subprocess.run(
                ["patch", "-f", str(full_path)],
                input=diff, capture_output=True, text=True, timeout=10
            )
            if p.returncode == 0:
                return True, ""
            return False, f"patch failed: {p.stderr[:500]}"

        elif tool == "write":
            content = fix.get("new_content", "")
            if not content:
                return False, "write requires new_content"
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            return True, ""

        elif tool == "linter":
            cmd = fix.get("linter_command", "npx eslint --fix")
            p = subprocess.run(
                cmd.split() + [str(full_path)],
                capture_output=True, text=True, timeout=30
            )
            if p.returncode in (0, 1):
                return True, p.stdout[:500]
            return False, f"linter failed: {p.stderr[:500]}"

        elif tool == "format":
            ext = full_path.suffix
            if ext in (".js", ".ts", ".tsx", ".jsx", ".json", ".css", ".html"):
                cmd = ["npx", "prettier", "--write", str(full_path)]
            elif ext in (".py",):
                cmd = ["ruff", "format", str(full_path)]
            else:
                return False, f"no formatter for {ext}"
            p = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if p.returncode == 0:
                return True, ""
            return False, f"formatter failed: {p.stderr[:500]}"

        else:
            return False, f"unknown tool: {tool}"
    except Exception as e:
        return False, str(e)


def validate_fix_exists(fix, repo_dirs):
    """Check fix references a real file (no validation of content for tool-based fixes)."""
    fp = fix.get("file_path", "")
    if not fp:
        return None
    for rd in repo_dirs:
        full = rd / fp
        if full.exists():
            fix["file_path"] = str(full)
            return fix
    return None

# ── Profile learning ──────────────────────────────────────────────────────────

def learn_from_fix(branch, profile, fix, fix_type, source_name, validated, error_msg=""):
    if not profile:
        return
    ts = datetime.now(timezone.utc).isoformat()

    record = {
        "timestamp": ts,
        "type": fix_type,
        "source": source_name,
        "validated": validated,
        "tool": fix.get("tool", "sed"),
        "file_path": fix.get("file_path", ""),
        "bug_description": fix.get("bug_description", ""),
        "commit_message": fix.get("commit_message", ""),
        "error": error_msg[:200] if error_msg else "",
    }
    if validated:
        profile.setdefault("successful_fixes", []).append(record)
    else:
        profile.setdefault("failed_fixes", []).append(record)

    fp = fix.get("file_path", "")
    if fp:
        ext = os.path.splitext(fp)[1]
        tool = fix.get("tool", "sed")
        pattern_desc = f"Modified {ext} file via {tool}"
        existing = [p.get("pattern") for p in profile.get("learned_patterns", [])]
        if pattern_desc not in existing:
            profile.setdefault("learned_patterns", []).append({
                "pattern": pattern_desc,
                "detail": fix.get("bug_description", "")[:200],
                "tool": tool,
                "discovered": ts
            })

    if validated and fix.get("commit_message"):
        skill_name = fix["commit_message"].split(":")[-1].strip()[:60]
        existing_skills = [s.get("name") for s in profile.get("skill_library", [])]
        if skill_name and skill_name not in existing_skills:
            profile.setdefault("skill_library", []).append({
                "name": skill_name,
                "description": fix.get("bug_description", "")[:200],
                "tool": fix.get("tool", "sed"),
                "file_type": os.path.splitext(fix.get("file_path", ""))[1],
                "discovered": ts,
                "use_count": 1
            })

    outcome = "success" if validated else "failure"
    reflection = f"{'Validated' if validated else 'Failed'} {fix_type} via {source_name} ({tool}): {fix.get('bug_description','')[:100]}"
    if error_msg:
        reflection += f" | error: {error_msg[:100]}"
    profile.setdefault("reflections", []).append({
        "lesson": reflection,
        "timestamp": ts,
        "outcome": outcome,
        "tool": tool,
    })

    knowledge_line = f"[{ts}] {fix.get('commit_message','')} — {fix.get('bug_description','')[:100]}"
    existing_knowledge = profile.get("branch_knowledge", "")
    profile["branch_knowledge"] = (existing_knowledge + "\n" + knowledge_line).strip()
    profile["total_learning_cycles"] = profile.get("total_learning_cycles", 0) + 1

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

# ── JSON extraction ───────────────────────────────────────────────────────────

def extract_json_fix(text):
    text = re.sub(r'```(?:json)?\s*\n?', '', text)
    text = text.strip()
    if text.endswith("```"):
        text = text[:-3]
    # Accept any JSON object with a tool field or file_path field
    for pattern in [
        r'\{[^{}]*"tool"[^{}]*"file_path"[^{}]*\}',
        r'\{[^{}]*"file_path"[^{}]*"tool"[^{}]*\}',
        r'\{[^{}]*"file_path"[^{}]*"old_string"[^{}]*\}',
        r'\{[^{}]*"old_string"[^{}]*"file_path"[^{}]*\}',
        r'\{[^{}]*"file_path"[^{}]*"new_content"[^{}]*\}',
        r'\{[^{}]*"file_path"[^{}]*"diff"[^{}]*\}',
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

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch", required=True)
    parser.add_argument("--type", choices=["bug", "ux", "meta"], required=True)
    parser.add_argument("--pass-number", type=int, default=1)
    parser.add_argument("--error-feedback", help="Build error from previous fix attempt for self-correction")
    parser.add_argument("--learn-after", help="JSON fix to learn from")
    parser.add_argument("--apply", help="JSON fix to apply (tool-based)")
    parser.add_argument("--constraint", help="Constraint to inject into prompt (e.g., 'No console.log removal')")
    parser.add_argument("--repo-path", help="Path to branch checkout directory for file scanning")
    parser.add_argument("--daily-fixes", help="Comma-separated list of bug descriptions already applied today across all branches")
    parser.add_argument("--daily-features", help="Comma-separated list of feature descriptions already applied today across all branches")
    args = parser.parse_args()

    # If --apply, apply the fix and exit
    if args.apply:
        try:
            fix = json.loads(args.apply)
        except Exception as e:
            print(f"[intel] Invalid apply JSON: {e}", file=sys.stderr)
            sys.exit(1)
        repo_dirs = [Path.home() / "datro", Path.home() / "datro-financecheque"]
        ok, err = apply_fix(fix, repo_dirs)
        if ok:
            print(f"[intel] Applied: {fix.get('tool','sed')} on {fix.get('file_path','')}", file=sys.stderr)
            print(fix.get("file_path", ""))
            sys.exit(0)
        else:
            print(f"[intel] Apply failed: {err}", file=sys.stderr)
            sys.exit(1)

    # If --learn-after, just update the profile
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
        error_msg = fix.pop("_error", "")
        learn_from_fix(args.branch, profile, fix, args.type, "manual", True, error_msg)
        print(f"[intel] Learned from fix for {args.branch}", file=sys.stderr)
        return

    ctx = load_branch_context(args.branch, args.repo_path or "")
    if args.constraint:
        ctx["constraint"] = args.constraint
    if args.daily_fixes:
        ctx["daily_fixes"] = args.daily_fixes
    if args.daily_features:
        ctx["daily_features"] = args.daily_features
    profile = get_profile(args.branch)

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

    # Build prompt — meta type uses its own prompt builder
    if args.type == "meta":
        system, prompt = build_meta_prompt(args.branch, ctx, profile, args.error_feedback or "")
    else:
        system, prompt = build_prompt(args.branch, args.type, ctx, profile, args.error_feedback or "")
    repo_dirs = [Path.home() / "datro", Path.home() / "datro-financecheque"]

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
                validated = validate_fix_exists(fix, repo_dirs)
                if validated:
                    tool = fix.get("tool", "sed")
                    # For sed, also validate old_string exists
                    if tool == "sed":
                        old = fix.get("old_string", "")
                        fp = validated["file_path"]
                        if old and old not in Path(fp).read_text():
                            print(f"[intel] {name} sed: old_string not found in {fp}", file=sys.stderr)
                            if profile and fix:
                                learn_from_fix(args.branch, profile, fix, args.type, name, False, "old_string not found")
                            continue
                    print(f"[intel] {name} validated fix ({tool}): {validated['file_path']}", file=sys.stderr)
                    if profile:
                        learn_from_fix(args.branch, profile, validated, args.type, name, True)
                    if profile:
                        next_idx = (start_idx + 1) % len(rotation)
                        profile["rotation_index"] = next_idx
                        save_profile(args.branch, profile)
                    print(json.dumps(validated))
                    return
                else:
                    print(f"[intel] {name} fix failed validation (file not found)", file=sys.stderr)
                    if profile and fix:
                        learn_from_fix(args.branch, profile, fix, args.type, name, False, "file not found")
            else:
                print(f"[intel] {name} response had no parseable JSON", file=sys.stderr)

    sys.exit(42)

if __name__ == "__main__":
    main()
