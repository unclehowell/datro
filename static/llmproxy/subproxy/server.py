#!/usr/bin/env python3
"""
LLM Sub-proxy — runs on each machine.
Exposes OpenAI-compatible API on ports 5000 and 4117.

Routing priority:
  1. CLI/IDE tmux sessions: kiro, kilo, groq, gemini, opencode
  2. Cloudflare worker (kiro.financecheque.uk) — upstream fallback
  3. Direct API keys from env (last resort)

Health endpoint reports per-CLI status for dashboard.
"""
import os, json, asyncio, logging, socket, subprocess, time, shutil
from pathlib import Path
from datetime import datetime
from aiohttp import web, ClientSession, ClientTimeout

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [subproxy] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(str(Path.home() / "llmproxy/logs/subproxy.log")),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
KIRO_SESSIONS_DIR = Path.home() / ".kiro/sessions/cli"
CLOUDFLARE_URL = "https://kiro.financecheque.uk/v1/chat/completions"

# CLI/IDE tools — tried in order, skipped if binary not found
CLI_TOOLS = [
    {"name": "kiro",     "bin": "kiro",     "tmux": "llmproxy-kiro",     "args": ["chat", "--trust-all-tools"]},
    {"name": "kilo",     "bin": "kilo",     "tmux": "llmproxy-kilo",     "args": []},
    {"name": "opencode", "bin": "opencode", "tmux": "llmproxy-opencode", "args": []},
    {"name": "groq",     "bin": "groq",     "tmux": "llmproxy-groq",     "args": ["chat"]},
    {"name": "gemini",   "bin": "gemini",   "tmux": "llmproxy-gemini",   "args": []},
]

# Direct API fallback providers (only used if cloudflare also fails)
DIRECT_PROVIDERS = [
    {"name": "gemini",  "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", "key_env": "GEMINI_API_KEY",  "model": "gemini-2.0-flash"},
    {"name": "groq",    "url": "https://api.groq.com/openai/v1/chat/completions",                         "key_env": "GROQ_API_KEY",    "model": "llama-3.3-70b-versatile"},
    {"name": "mistral", "url": "https://api.mistral.ai/v1/chat/completions",                              "key_env": "MISTRAL_API_KEY", "model": "mistral-small-latest"},
]


def load_env():
    for path in [
        Path.home() / "kiro-proxy.env",
        Path.home() / ".hermes/.env",
        Path.home() / "llmproxy/.env",
        BASE_DIR.parent / ".env",
    ]:
        if path.exists():
            for line in path.read_text().splitlines():
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k not in os.environ:
                        os.environ[k] = v


def find_bin(name: str) -> str | None:
    """Return full path to binary, checking ~/.local/bin and ~/.npm-global/bin."""
    for prefix in [Path.home() / ".local/bin", Path.home() / ".npm-global/bin"]:
        p = prefix / name
        if p.exists():
            return str(p)
    return shutil.which(name)


def cli_available(tool: dict) -> bool:
    return find_bin(tool["bin"]) is not None


def tmux_session_running(session: str) -> bool:
    return subprocess.run(
        ["tmux", "has-session", "-t", session], capture_output=True
    ).returncode == 0


def ensure_tmux_session(tool: dict):
    session = tool["tmux"]
    if tmux_session_running(session):
        return
    bin_path = find_bin(tool["bin"])
    if not bin_path:
        raise RuntimeError(f"{tool['name']} binary not found")
    cmd = [bin_path] + tool["args"]
    subprocess.run(["tmux", "new-session", "-d", "-s", session], check=True)
    subprocess.run(["tmux", "send-keys", "-t", session, " ".join(cmd), "Enter"])
    time.sleep(4)


async def query_kiro_tmux(prompt: str, timeout: int = 60) -> str | None:
    """Send prompt to kiro tmux session, poll session file for response."""
    tool = next(t for t in CLI_TOOLS if t["name"] == "kiro")
    try:
        ensure_tmux_session(tool)
    except Exception as e:
        log.warning(f"kiro tmux start failed: {e}")
        return None

    session_files = sorted(
        KIRO_SESSIONS_DIR.glob("*.jsonl"),
        key=lambda f: f.stat().st_mtime, reverse=True
    )
    watch_file = session_files[0] if session_files else None
    start_size = watch_file.stat().st_size if watch_file else 0

    safe = prompt.replace("'", "'\\''")
    subprocess.run(["tmux", "send-keys", "-t", tool["tmux"], safe, "Enter"])

    deadline = time.time() + timeout
    while time.time() < deadline:
        await asyncio.sleep(1)
        files = sorted(
            KIRO_SESSIONS_DIR.glob("*.jsonl"),
            key=lambda f: f.stat().st_mtime, reverse=True
        )
        if not files:
            continue
        cur = files[0]
        if cur != watch_file or cur.stat().st_size > start_size:
            try:
                for line in reversed(cur.read_text().splitlines()):
                    try:
                        d = json.loads(line)
                        if d.get("kind") == "AssistantMessage":
                            parts = d.get("data", {}).get("content", [])
                            text = " ".join(
                                c.get("data", "") for c in (parts if isinstance(parts, list) else [])
                                if isinstance(c, dict) and c.get("kind") == "text"
                            ).strip()
                            if text:
                                return text
                    except Exception:
                        pass
            except Exception:
                pass
    return None


async def query_cli_tmux(tool: dict, prompt: str, timeout: int = 45) -> str | None:
    """Send prompt to a generic CLI tmux session, capture pane output."""
    try:
        ensure_tmux_session(tool)
    except Exception as e:
        log.warning(f"{tool['name']} tmux start failed: {e}")
        return None

    # Capture pane before sending
    before = subprocess.run(
        ["tmux", "capture-pane", "-p", "-t", tool["tmux"]],
        capture_output=True, text=True
    ).stdout

    safe = prompt.replace("'", "'\\''")
    subprocess.run(["tmux", "send-keys", "-t", tool["tmux"], safe, "Enter"])

    deadline = time.time() + timeout
    while time.time() < deadline:
        await asyncio.sleep(2)
        after = subprocess.run(
            ["tmux", "capture-pane", "-p", "-t", tool["tmux"]],
            capture_output=True, text=True
        ).stdout
        new_text = after[len(before):].strip() if len(after) > len(before) else ""
        if new_text and len(new_text) > 20:
            return new_text
    return None


async def try_cli_tools(prompt: str) -> str | None:
    """Try each CLI tool in order, return first successful response."""
    for tool in CLI_TOOLS:
        if not cli_available(tool):
            log.debug(f"Skipping {tool['name']}: not installed")
            continue
        log.info(f"Trying CLI: {tool['name']}")
        try:
            if tool["name"] == "kiro":
                result = await query_kiro_tmux(prompt)
            else:
                result = await query_cli_tmux(tool, prompt)
            if result:
                log.info(f"Served via {tool['name']} tmux")
                return result
        except Exception as e:
            log.warning(f"{tool['name']} failed: {e}")
    return None


async def try_cloudflare(body: dict) -> dict | None:
    """Forward request to cloudflare worker."""
    try:
        timeout = ClientTimeout(total=30)
        async with ClientSession(timeout=timeout) as session:
            async with session.post(
                CLOUDFLARE_URL,
                json=body,
                headers={"Content-Type": "application/json", "Authorization": "Bearer llmproxy-cf"},
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    result["x_provider"] = "cloudflare"
                    log.info("Served via cloudflare")
                    return result
    except Exception as e:
        log.warning(f"Cloudflare failed: {e}")
    return None


async def try_direct_api(body: dict) -> dict | None:
    """Last resort: direct API calls using local env keys."""
    for p in DIRECT_PROVIDERS:
        key = os.environ.get(p["key_env"])
        if not key:
            continue
        try:
            payload = {**body, "model": p["model"]}
            timeout = ClientTimeout(total=30)
            async with ClientSession(timeout=timeout) as session:
                async with session.post(
                    p["url"],
                    json=payload,
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        result["x_provider"] = p["name"]
                        log.info(f"Served via direct API: {p['name']}")
                        return result
        except Exception as e:
            log.warning(f"Direct API {p['name']} failed: {e}")
    return None


async def chat_completions(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    messages = body.get("messages", [])
    prompt = messages[-1].get("content", "") if messages else ""

    # 1. Try CLI/IDE tmux sessions
    cli_response = await try_cli_tools(prompt)
    if cli_response:
        return web.json_response({
            "choices": [{"message": {"role": "assistant", "content": cli_response}}],
            "model": body.get("model", "auto"),
            "x_provider": "cli-tmux",
        })

    # 2. Try cloudflare worker
    cf_result = await try_cloudflare(body)
    if cf_result:
        return web.json_response(cf_result)

    # 3. Direct API fallback
    api_result = await try_direct_api(body)
    if api_result:
        return web.json_response(api_result)

    return web.json_response({"error": "All providers failed"}, status=503)


def get_cli_status() -> dict:
    """Return status of each CLI tool: installed/running/missing."""
    status = {}
    for tool in CLI_TOOLS:
        installed = cli_available(tool)
        running = tmux_session_running(tool["tmux"]) if installed else False
        status[tool["name"]] = {
            "installed": installed,
            "tmux_running": running,
            "status": "running" if running else ("installed" if installed else "missing"),
        }
    return status


async def health(request):
    cli_status = get_cli_status()
    available_clis = [k for k, v in cli_status.items() if v["installed"]]
    return web.json_response({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "machine": socket.gethostname(),
        "tailscale_ip": "100.88.178.91",
        "cli_tools": cli_status,
        "available_clis": available_clis,
        "version": "2.1.0",
    })


async def models(request):
    """OpenAI-compatible /v1/models endpoint."""
    cli_status = get_cli_status()
    model_list = [
        {"id": name, "object": "model", "owned_by": "llmproxy",
         "available": info["installed"]}
        for name, info in cli_status.items()
    ]
    model_list.append({"id": "auto", "object": "model", "owned_by": "llmproxy", "available": True})
    return web.json_response({"object": "list", "data": model_list})


async def start_server(port):
    app = web.Application()
    app.router.add_post("/v1/chat/completions", chat_completions)
    app.router.add_post("/v1/completions", chat_completions)
    app.router.add_get("/v1/models", models)
    app.router.add_get("/health", health)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    log.info(f"Listening on port {port}")
    return runner


async def main():
    load_env()
    runners = []
    for port in [5000, 4117]:
        try:
            runners.append(await start_server(port))
        except OSError as e:
            log.warning(f"Could not bind port {port}: {e}")
    if not runners:
        raise RuntimeError("Could not bind any port")
    available = [t["name"] for t in CLI_TOOLS if cli_available(t)]
    log.info(f"Sub-proxy ready. Available CLIs: {available}")
    try:
        await asyncio.Event().wait()
    finally:
        for r in runners:
            await r.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
