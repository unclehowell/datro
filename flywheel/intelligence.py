#!/usr/bin/env python3
"""
FCUK Proxy Intelligence - queries parent proxy then falls back through local LLM tools.
Returns a JSON bug-fix report with validated file_path, or "null" if nothing found.
"""
import json
import os
import re
import subprocess
import sys
import urllib.request
import urllib.error
from pathlib import Path

FCUK_DIR = Path.home() / ".fcukproxy"
ENV_FILE = FCUK_DIR / ".env"
CONFIG_FILE = FCUK_DIR / "machine.json"
REPO_DIR = Path.home() / "datro-financecheque"

# Parse --repo argument to override REPO_DIR
if "--repo" in sys.argv:
    idx = sys.argv.index("--repo")
    if idx + 1 < len(sys.argv):
        REPO_DIR = Path(sys.argv[idx + 1])

PARENT_URL = "https://www.financecheque.uk/api/proxy"
LOCAL_PROXY_URL = "http://localhost:6000/v1/chat/completions"
CHILD_PROXY_URL = ""
if CONFIG_FILE.exists():
    try:
        cfg = json.loads(CONFIG_FILE.read_text())
        CHILD_PROXY_URL = cfg.get("proxy_url", "")
    except:
        pass

def load_env_keys():
    keys = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    keys[k.strip()] = v.strip()
    for key in ("OPENAI_API_KEY","ANTHROPIC_API_KEY","GEMINI_API_KEY",
                "OPENROUTER_API_KEY","DEEPSEEK_API_KEY","NVAPI_KEY"):
        if key in os.environ:
            keys[key] = os.environ[key]
    return keys

ENV_KEYS = load_env_keys()

def get_machine_id():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f).get("machine_id", "")
    return ""

MACHINE_ID = get_machine_id()

def get_repo_context(max_files=30):
    """Return a summary of the repo structure + key file snippets for LLM context."""
    parts = []
    parts.append(f"Repository: {REPO_DIR}")
    r = subprocess.run(
        ["git", "-C", str(REPO_DIR), "branch", "--show-current"],
        capture_output=True, text=True, timeout=5
    )
    parts.append(f"Branch: {r.stdout.strip()}")

    # List tracked source files
    r = subprocess.run(
        ["git", "-C", str(REPO_DIR), "ls-files", "src/", "lib/", "app/", "api/",
         "functions/", "public/fcukproxy/", "static/", "scripts/",
         "*.ts", "*.tsx", "*.py", "*.js", "*.sh", "*.json"],
        capture_output=True, text=True, timeout=10
    )
    files = [f for f in r.stdout.strip().split("\n") if f and not f.startswith("node_modules")]
    parts.append(f"\nTracked source files ({len(files)}):")
    parts.extend(f"  {f}" for f in files[:max_files])

    # Show full content of key files (skip if not present in this branch)
    for fname in ("functions/api/proxy/[[catchall]].ts", "server.ts"):
        fp = REPO_DIR / fname
        if fp.exists():
            content_lines = fp.read_text().split("\n")
            parts.append(f"\n--- {fname} (full file, {len(content_lines)} lines) ---")
            parts.extend(content_lines)

    # Show first 100 lines of other key files
    for fname in ("src/App.tsx", "src/main.tsx", "src/App.js", "public/fcukproxy/agent.py", "public/fcukproxy/install.sh"):
        fp = REPO_DIR / fname
        if fp.exists():
            content_lines = fp.read_text().split("\n")
            parts.append(f"\n--- {fname} (first 100 lines) ---")
            parts.extend(content_lines[:100])

    # Show first 80 lines of any package.json or tsconfig.json
    for fname in ("package.json", "tsconfig.json"):
        fp = REPO_DIR / fname
        if fp.exists():
            content_lines = fp.read_text().split("\n")
            parts.append(f"\n--- {fname} (first 80 lines) ---")
            parts.extend(content_lines[:80])

    return "\n".join(parts)

def query_via_child_proxy(prompt: str) -> str | None:
    """Try direct child proxy chat endpoint if reachable."""
    child_url = CHILD_PROXY_URL or "http://private-proxy.internal:4001"
    payload = json.dumps({"message": prompt, "chat_only": True})
    cmd = ["curl", "-sf", "--max-time", "60",
           "-X", "POST", f"{child_url}/chat",
           "-H", "Content-Type: application/json",
           "-d", payload]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=70)
        if r.returncode == 0 and r.stdout:
            data = json.loads(r.stdout)
            reply = data.get("reply", "")
            if reply:
                return reply
    except Exception as e:
        print(f"[intel] child proxy: {e}", file=sys.stderr)
    return None

def query_parent_proxy(prompt: str) -> str | None:
    """Query parent proxy chat routing endpoint. Routes to child proxy."""
    payload = json.dumps({
        "message": prompt,
        "chat_only": True,
    })
    cmd = ["curl", "-sf", "--max-time", "60",
           "-X", "POST", f"{PARENT_URL}?action=chat",
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
    except Exception as e:
        print(f"[intel] parent proxy: {e}", file=sys.stderr)
    return None

def query_via_openrouter(prompt: str) -> str | None:
    api_key = ENV_KEYS.get("OPENROUTER_API_KEY")
    if not api_key or api_key == "PLACEHOLDER":
        return None

    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a senior software engineer. Find the single biggest, most apparent, obvious, and crucial bug in the actual source files provided. Return ONLY raw JSON (no markdown) with keys: file_path (relative to repo root, must be a real file), bug_description, old_string (exact text that exists in the file), new_string (replacement), commit_message."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 4096,
        "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload, method="POST",
    )
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("HTTP-Referer", "https://www.financecheque.uk")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if content:
            return content
    except Exception as e:
        print(f"[intel] OpenRouter: {e}", file=sys.stderr)
    return None

def query_via_gemini(prompt: str) -> str | None:
    key = ENV_KEYS.get("GEMINI_API_KEY")
    if not key or key == "PLACEHOLDER":
        return None
    payload = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": "You are a senior software engineer. Return ONLY a valid JSON object with keys: file_path, bug_description, old_string, new_string, commit_message. No markdown, no explanation."}]}
    }).encode()
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
        data=payload, method="POST",
    )
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if text:
            return text
    except Exception as e:
        print(f"[intel] Gemini: {e}", file=sys.stderr)
    return None

def query_via_deepseek(prompt: str) -> str | None:
    key = ENV_KEYS.get("DEEPSEEK_API_KEY")
    if not key or key == "PLACEHOLDER":
        return None
    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a senior software engineer. Find the single biggest bug. Return ONLY raw JSON: file_path, bug_description, old_string, new_string, commit_message."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 4096,
        "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(
        "https://api.deepseek.com/v1/chat/completions",
        data=payload, method="POST",
    )
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if content:
            return content
    except Exception as e:
        print(f"[intel] DeepSeek: {e}", file=sys.stderr)
    return None

def query_via_nvidia(prompt: str) -> str | None:
    api_key = ENV_KEYS.get("NVAPI_KEY")
    if not api_key or api_key == "PLACEHOLDER":
        return None

    payload = json.dumps({
        "model": "meta/llama-3.1-8b-instruct",
        "messages": [
            {"role": "system", "content": "You are a senior software engineer. Find the single biggest, most apparent, obvious, and crucial bug in the actual source files provided. Return ONLY raw JSON (no markdown) with keys: file_path (relative to repo root, must be a real file), bug_description, old_string (exact text that exists in the file), new_string (replacement), commit_message."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 4096,
        "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=payload, method="POST",
    )
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if content:
            return content
    except Exception as e:
        print(f"[intel] NVIDIA: {e}", file=sys.stderr)
    return None

def query_via_local_proxy(prompt: str) -> str | None:
    """Use local agent proxy OpenAI-compatible endpoint."""
    payload = json.dumps({
        "model": "big-pickle",
        "messages": [
            {"role": "system", "content": "You are a senior software engineer. Find the single biggest, most apparent, obvious, and crucial bug in the actual source files provided. Return ONLY raw JSON (no markdown) with keys: file_path (relative to repo root, must be a real file), bug_description, old_string (exact text that exists in the file), new_string (replacement), commit_message."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 4096,
        "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(LOCAL_PROXY_URL, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if content:
            return content
    except Exception as e:
        print(f"[intel] local proxy: {e}", file=sys.stderr)
    return None

def validate_fix(fix: dict) -> dict | None:
    """Validate that the fix references a real file and the old_string exists."""
    fp = fix.get("file_path", "")
    # Handle absolute paths
    if fp.startswith("/home/"):
        fp = str(Path(fp).relative_to(REPO_DIR))
    elif fp.startswith("/"):
        fp = str(Path(fp).relative_to("/"))
    # Remove duplicate REPO_DIR prefix
    if str(REPO_DIR) in fp:
        fp = fp.replace(str(REPO_DIR), "").lstrip("/")

    fix["file_path"] = fp
    full_path = REPO_DIR / fp
    if not full_path.exists():
        print(f"[intel] VALIDATION FAIL: {fp} does not exist", file=sys.stderr)
        return None

    old = fix.get("old_string", "")
    if not old:
        print(f"[intel] VALIDATION FAIL: no old_string", file=sys.stderr)
        return None

    content = full_path.read_text()
    if old not in content:
        print(f"[intel] VALIDATION FAIL: old_string not found in {fp}", file=sys.stderr)
        # Try a more lenient match (whitespace)
        old_normalized = re.sub(r'\s+', ' ', old)
        content_normalized = re.sub(r'\s+', ' ', content)
        if old_normalized in content_normalized:
            # Find the actual content with original whitespace
            import difflib
            matcher = difflib.SequenceMatcher(None, content_normalized, old_normalized)
            for match in matcher.get_matching_blocks():
                if match.size > 10:
                    fix["old_string"] = content[match.a:match.a + len(old)]
                    print(f"[intel] matched via whitespace-insensitive", file=sys.stderr)
                    return fix
        return None

    return fix

def extract_json_fix(text: str) -> dict | None:
    """Extract JSON fix from text, trying various formats."""
    # Remove markdown code fences
    text = re.sub(r'```(?:json)?\s*\n?', '', text)
    text = text.strip()
    if text.endswith("```"):
        text = text[:-3]

    # Try to find JSON object with file_path key
    for pattern in [
        r'\{[^{}]*"file_path"[^{}]*"old_string"[^{}]*\}',
        r'\{[^{}]*"old_string"[^{}]*"file_path"[^{}]*\}',
        r'\{[^{}]*"file_path"[^{}]*\}',
        r'\{[^{}]*"bug_description"[^{}]*\}',
    ]:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                # Try to fix escaped quotes
                fixed = re.sub(r'(?<!\\)"((?:[^"\\]|\\.)*)"', lambda x: '"' + x.group(1).replace('"', '\\"') + '"', m.group(0))
                try:
                    return json.loads(fixed)
                except:
                    pass

    # Try direct json parse of the whole text
    try:
        return json.loads(text)
    except:
        pass

    return None

def run_static_analysis() -> list:
    """Run static analysis to find actual issues in the repo."""
    issues = []

    for pattern, bug_type, globs in [
        (r'console\.(log|debug)\(', "console_log", ["*.ts", "*.tsx", "*.py", "*.js"]),
        (r'TODO|FIXME|HACK|XXX', "todo", ["*.ts", "*.tsx", "*.py", "*.js", "*.sh"]),
        (r'@ts-(ignore|expect-error|no-check)', "suppressed_error", ["*.ts", "*.tsx"]),
        (r'(api_key|apiKey|secret|password|token)\s*[:=]\s*["\'](?!REPLACED|ENV_VAR)', "hardcoded_secret", ["*.ts", "*.tsx", "*.py", "*.js"]),
    ]:
        for g in globs:
            try:
                r = subprocess.run(
                    ["rg", "-n", pattern, "-g", g, ".", "--no-heading"],
                    capture_output=True, text=True, timeout=15, cwd=str(REPO_DIR)
                )
                for line in r.stdout.strip().split("\n"):
                    if not line:
                        continue
                    parts = line.split(":", 2)
                    if len(parts) >= 2:
                        issues.append({
                            "file": parts[0].lstrip("./"),
                            "line": int(parts[1]) if parts[1].isdigit() else 0,
                            "type": bug_type,
                            "detail": line,
                        })
            except:
                pass

    return issues

def run_linter_analysis() -> list:
    """Run eslint (JS/TS) and pylint (Python) for structured bug detection."""
    issues = []

    # eslint for JS/TS files
    eslint_bin = subprocess.run(
        ["which", "eslint"], capture_output=True, text=True, timeout=5
    ).stdout.strip()
    if not eslint_bin:
        local_eslint = Path(str(REPO_DIR)) / "node_modules" / ".bin" / "eslint"
        if local_eslint.exists():
            eslint_bin = str(local_eslint)
    if eslint_bin:
        try:
            r = subprocess.run(
                [eslint_bin, "--format", "json", "--ext", ".ts,.tsx,.js", "."],
                capture_output=True, text=True, timeout=60, cwd=str(REPO_DIR)
            )
            if r.stdout:
                data = json.loads(r.stdout)
                for file_result in data:
                    for msg in file_result.get("messages", []):
                        if msg.get("severity", 0) < 2:
                            continue
                        issues.append({
                            "file": file_result.get("filePath", "").replace(str(REPO_DIR), "").lstrip("/"),
                            "line": msg.get("line", 0),
                            "type": "eslint",
                            "detail": f"{msg.get('ruleId', 'unknown')}: {msg.get('message', '')}",
                        })
        except Exception as e:
            print(f"[intel] eslint: {e}", file=sys.stderr)

    # pylint for Python files
    pylint_bin = subprocess.run(
        ["which", "pylint"], capture_output=True, text=True, timeout=5
    ).stdout.strip()
    if pylint_bin:
        try:
            r = subprocess.run(
                [pylint_bin, "--output-format=json", "--recursive=y", "."],
                capture_output=True, text=True, timeout=60, cwd=str(REPO_DIR)
            )
            if r.stdout:
                data = json.loads(r.stdout)
                for msg in data:
                    if msg.get("type") not in ("error", "fatal"):
                        continue
                    issues.append({
                        "file": msg.get("path", ""),
                        "line": msg.get("line", 0),
                        "type": "pylint",
                        "detail": f"{msg.get('message-id', 'unknown')}: {msg.get('message', '')}",
                    })
        except Exception as e:
            print(f"[intel] pylint: {e}", file=sys.stderr)

    return issues

def pick_best_bug(issues: list) -> dict | None:
    """Pick highest-priority bug from static analysis and construct a fix."""
    priority = {"hardcoded_secret": 5, "console_log": 4, "suppressed_error": 3, "todo": 2}
    issues.sort(key=lambda x: priority.get(x["type"], 0), reverse=True)

    for issue in issues:
        fp = REPO_DIR / issue["file"]
        if not fp.exists():
            continue

        content = fp.read_text()
        lines = content.split("\n")
        line_num = issue["line"]
        old_line = lines[line_num - 1] if 0 < line_num <= len(lines) else ""

        if issue["type"] == "console_log" and old_line:
            return {
                "file_path": issue["file"],
                "bug_description": f"Debugging console.log left in {issue['file']}:{line_num}",
                "old_string": old_line.rstrip(),
                "new_string": "",
                "commit_message": f"fix: remove debugging console.log from {issue['file']}",
            }

        if issue["type"] == "hardcoded_secret" and old_line:
            new_line = re.sub(r'=\s*["\'][^"\']+["\']', ' = "REPLACED_WITH_ENV_VAR"', old_line)
            return {
                "file_path": issue["file"],
                "bug_description": f"Hardcoded credential in {issue['file']}:{line_num}",
                "old_string": old_line.rstrip(),
                "new_string": new_line.rstrip(),
                "commit_message": f"fix: remove hardcoded secret from {issue['file']}, use env var",
            }

        if issue["type"] == "suppressed_error" and old_line:
            return {
                "file_path": issue["file"],
                "bug_description": f"TypeScript suppression comment in {issue['file']}:{line_num}",
                "old_string": old_line.rstrip(),
                "new_string": "",
                "commit_message": f"fix: remove unnecessary ts-ignore from {issue['file']}",
            }

        if issue["type"] == "todo" and old_line:
            new_line = re.sub(r'(?i)\s*(TODO|FIXME|HACK|XXX)\b.*', '', old_line)
            if new_line.strip() and new_line != old_line:
                return {
                    "file_path": issue["file"],
                    "bug_description": f"Stale TODO/FIXME in {issue['file']}:{line_num}",
                    "old_string": old_line.rstrip(),
                    "new_string": new_line.rstrip(),
                    "commit_message": f"chore: remove stale TODO from {issue['file']}",
                }
            elif new_line.strip() and new_line == old_line:
                continue

    # Fallback: remove trailing whitespace in any source file
    for g in ("*.ts", "*.tsx", "*.py", "*.js", "*.sh", "*.html", "*.css"):
        try:
            r = subprocess.run(
                ["rg", "-l", "[[:space:]]+$", "-g", g, ".", "--no-heading"],
                capture_output=True, text=True, timeout=15, cwd=str(REPO_DIR)
            )
            for file in r.stdout.strip().split("\n"):
                if not file:
                    continue
                fp = REPO_DIR / file
                if not fp.exists():
                    continue
                content = fp.read_text()
                if content != content.rstrip("\n") + "\n":
                    return {
                        "file_path": file,
                        "bug_description": f"Trailing whitespace or missing trailing newline in {file}",
                        "old_string": content,
                        "new_string": content.rstrip("\n") + "\n",
                        "commit_message": f"chore: fix trailing whitespace in {file}",
                    }
        except:
            pass

    return None

def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else ""
    if not prompt:
        branch = subprocess.run(
            ["git", "-C", str(REPO_DIR), "branch", "--show-current"],
            capture_output=True, text=True, timeout=5
        ).stdout.strip()
        prompt = f"Find the single biggest, most apparent, obvious and crucial bug in this codebase on branch '{branch}'. Read the actual source code. Return a JSON object with: file_path, bug_description, old_string (exact text to replace), new_string (replacement), commit_message."

    # Include known runtime issues from previous deployment checks
    known_issues_text = ""
    state_file = FCUK_DIR / "release-state.json"
    if state_file.exists():
        try:
            state = json.loads(state_file.read_text())
            issues = state.get("known_issues", [])
            if issues:
                lines = ["Known runtime issues from previous deployment checks:"]
                for iss in issues[-5:]:
                    lines.append(f"  - branch={iss.get('branch','?')} url={iss.get('url','?')} console_errors={iss.get('console_errors')} viewport_issues={iss.get('viewport_issues')} detected={iss.get('detected_at','?')}")
                known_issues_text = "\n".join(lines)
        except Exception:
            pass

    full_prompt = f"{prompt}\n\nHere is the repo context:\n{get_repo_context()}"
    if known_issues_text:
        full_prompt += f"\n\n{known_issues_text}\nIf any of these known issues exist in this codebase, prioritize fixing them."

    # Strategy: try each intelligence source in order (fastest/cheapest first), validate the fix
    for source_name, source_func in [
        ("local proxy", lambda: query_via_local_proxy(full_prompt)),
        ("NVIDIA", lambda: query_via_nvidia(full_prompt)),
        ("child proxy", lambda: query_via_child_proxy(full_prompt)),
        ("parent proxy", lambda: query_parent_proxy(full_prompt)),
        ("OpenRouter", lambda: query_via_openrouter(full_prompt)),
        ("Gemini", lambda: query_via_gemini(full_prompt)),
        ("DeepSeek", lambda: query_via_deepseek(full_prompt)),
    ]:
        print(f"[intel] trying {source_name}...", file=sys.stderr)
        result = source_func()
        if result:
            fix = extract_json_fix(result)
            if fix:
                validated = validate_fix(fix)
                if validated:
                    print(f"[intel] {source_name} returned validated fix for {validated['file_path']}", file=sys.stderr)
                    print(json.dumps(validated))
                    return
                else:
                    print(f"[intel] {source_name} fix failed validation", file=sys.stderr)
            else:
                print(f"[intel] {source_name} response had no parseable JSON", file=sys.stderr)

    # Fall back to linter-based static analysis
    print("[intel] all LLM sources exhausted, running linter analysis...", file=sys.stderr)
    lint_issues = run_linter_analysis()
    print(f"[intel] linter analysis found {len(lint_issues)} issues", file=sys.stderr)
    best = pick_best_bug(lint_issues)
    if best:
        print(f"[intel] linter fix for {best['file_path']}", file=sys.stderr)
        print(json.dumps(best))
        return

    # Fall back to rg-based static analysis
    print("[intel] linters found no actionable bug, running rg-based analysis...", file=sys.stderr)
    issues = run_static_analysis()
    print(f"[intel] rg analysis found {len(issues)} issues", file=sys.stderr)
    best = pick_best_bug(issues)
    if best:
        print(f"[intel] rg fix for {best['file_path']}", file=sys.stderr)
        print(json.dumps(best))
        return

    print("[intel] no fix found from any source", file=sys.stderr)
    print("null")

if __name__ == "__main__":
    main()
