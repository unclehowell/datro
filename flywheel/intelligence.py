#!/usr/bin/env python3
"""
Flywheel Agent — context-aware AI fix selector.
Usage: intelligence.py --branch <name> --type bug|ux

Reads agent/ files for rich context, routes through 7 AI sources,
outputs JSON fix or exits 42 for pool fallback.
"""
import argparse, json, os, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path

FCUK_DIR = Path.home() / ".fcukproxy"
AGENT_DIR = FCUK_DIR / "agent"
ENV_FILE = FCUK_DIR / ".env"
CONFIG_FILE = FCUK_DIR / "machine.json"
PARENT_URL = "https://www.financecheque.uk/api/proxy"
LOCAL_PROXY_URL = "http://localhost:6000/v1/chat/completions"

CHILD_PROXY_URL = ""
if CONFIG_FILE.exists():
    try:
        CHILD_PROXY_URL = json.loads(CONFIG_FILE.read_text()).get("proxy_url", "")
    except Exception:
        pass

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


def build_prompt(branch, fix_type, ctx):
    if fix_type == "bug":
        task = "Find the single most impactful BUG in the deployed website's source code.\n- FIRST visit the live URL (provided below) in your browser and visually inspect the site\n- Take a screenshot, check console for JS errors, test navigation, verify forms\n- Check mobile layout, fonts, images, links, meta tags, structured data\n- Must affect real users or SEO\n- Include SEO improvements (meta tags, structured data, alt text, canonicals) as bug fixes\n- Fix must be a simple string replacement in one file\n- Output ONLY valid JSON no markdown"
        system = "You are a senior software engineer improving websites. Find the biggest real bug. Return ONLY JSON: {\"file_path\": \"relative/path\", \"bug_description\": \"why this matters\", \"old_string\": \"exact existing text\", \"new_string\": \"replacement text\", \"commit_message\": \"fix(branch): description\"}. No explanation, no markdown."
    else:
        task = "Find the single most impactful UX IMPROVEMENT for the deployed website.\n- FIRST visit the live URL (provided below) in your browser and visually inspect the site\n- Take a screenshot, check mobile responsiveness, navigation, forms, load time\n- Evaluate: layout, typography, colour contrast, tap targets, animations, accessibility\n- Must make the website easier or more pleasant to use\n- Navigation, forms, mobile, load time, accessibility\n- Fix must be a simple string replacement in one file\n- Output ONLY valid JSON no markdown"
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

## Task
{task}

## Live Website
The branch website is deployed and live at: {ctx['url']}
You can VISIT this URL in your browser to visually inspect the site, take screenshots,
analyze layout, check mobile responsiveness, evaluate UX, and identify bugs.
Use the deployed website as your primary source of truth — the source code may differ
from what's live if deploys are pending.

Remember: the code is at /home/ubuntu/datro (or datro-financecheque). Find a real, verifiable bug in a file that exists. old_string MUST be exact text found in the file.
"""
    return system, prompt


def query_child_proxy(prompt, system):
    child_url = CHILD_PROXY_URL or "http://172.31.29.216:4001"
    payload = json.dumps({"message": f"{system}\n\n{prompt}", "chat_only": True})
    cmd = ["curl", "-sf", "--max-time", "60", "-X", "POST", f"{child_url}/chat",
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


def query_parent_proxy(prompt, system):
    payload = json.dumps({"message": f"{system}\n\n{prompt}", "chat_only": True})
    cmd = ["curl", "-sf", "--max-time", "60", "-X", "POST", f"{PARENT_URL}?action=chat",
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


def query_local_proxy(prompt, system):
    payload = json.dumps({"model": "big-pickle", "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ], "max_tokens": 4096, "temperature": 0.3}).encode()
    req = urllib.request.Request(LOCAL_PROXY_URL, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content
    except Exception:
        return None


def get_repo_files(branch, repo_dirs):
    """Get list of relevant source files from the repo."""
    files = []
    for rd in repo_dirs:
        if not rd.exists():
            continue
        r = subprocess.run(
            ["git", "-C", str(rd), "ls-files"],
            capture_output=True, text=True, timeout=10
        )
        for f in r.stdout.strip().split("\n"):
            if f and not f.startswith("node_modules"):
                files.append(str(rd / f))
    return files


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
    """Validate fix references a real file and old_string exists."""
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch", required=True)
    parser.add_argument("--type", choices=["bug", "ux"], required=True)
    parser.add_argument("--pass-number", type=int, default=1)
    args = parser.parse_args()

    ctx = load_branch_context(args.branch)
    system, prompt = build_prompt(args.branch, args.type, ctx)
    repo_dirs = [Path.home() / "datro", Path.home() / "datro-financecheque"]

    sources = [
        ("local proxy", lambda: query_local_proxy(prompt, system)),
        ("NVIDIA", lambda: query_nvidia(prompt, system)),
        ("child proxy", lambda: query_child_proxy(prompt, system)),
        ("parent proxy", lambda: query_parent_proxy(prompt, system)),
        ("OpenRouter", lambda: query_openrouter(prompt, system)),
        ("Gemini", lambda: query_gemini(prompt, system)),
        ("DeepSeek", lambda: query_deepseek(prompt, system)),
    ]

    for name, func in sources:
        print(f"[intel] trying {name}...", file=sys.stderr)
        try:
            result = func()
        except Exception:
            continue
        if result:
            fix = extract_json_fix(result)
            if fix:
                validated = validate_fix(fix, repo_dirs)
                if validated:
                    print(f"[intel] {name} validated fix for {validated['file_path']}", file=sys.stderr)
                    print(json.dumps(validated))
                    return
                print(f"[intel] {name} fix failed validation", file=sys.stderr)
            else:
                print(f"[intel] {name} response had no parseable JSON", file=sys.stderr)

    # Signal pool fallback
    sys.exit(42)


if __name__ == "__main__":
    main()
