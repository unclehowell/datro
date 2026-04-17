#!/usr/bin/env python3
"""
LLM Sub-proxy - runs on each machine.
Exposes OpenAI-compatible API on ports 5000 and 4117.
Routes to available providers via direct API calls (priority order).
Loads API keys from ~/kiro-proxy.env and ~/.hermes/.env.
"""
import os, json, asyncio, logging, socket, subprocess, time, glob
from pathlib import Path
from datetime import datetime
from aiohttp import web, ClientSession, ClientTimeout

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [subproxy] %(levelname)s: %(message)s",
    handlers=[logging.FileHandler(str(Path.home() / "llmproxy/logs/subproxy.log")), logging.StreamHandler()],
)
log = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
CONFIG_DIR = BASE_DIR / "config"


def load_env():
    for path in [Path.home() / "kiro-proxy.env", Path.home() / ".hermes/.env",
                 Path.home() / "llmproxy/.env", BASE_DIR.parent / ".env"]:
        if path.exists():
            for line in path.read_text().splitlines():
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k not in os.environ:
                        os.environ[k] = v


# Provider definitions — tried in priority order, skipped if no key
PROVIDERS = [
    {
        "name": "mistral",
        "url": "https://api.mistral.ai/v1/chat/completions",
        "key_env": "MISTRAL_API_KEY",
        "default_model": "mistral-small-latest",
    },
    {
        "name": "nvidia",
        "url": "https://integrate.api.nvidia.com/v1/chat/completions",
        "key_env": "NVIDIA_API_KEY",
        "default_model": "meta/llama-3.3-70b-instruct",
    },
    {
        "name": "gemini",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "key_env": "GEMINI_API_KEY",
        "default_model": "gemini-2.0-flash",
    },
    {
        "name": "groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
        "default_model": "llama-3.3-70b-versatile",
    },
    {
        "name": "openrouter",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "key_env": "OPENROUTER_API_KEY",
        "default_model": "meta-llama/llama-3.3-70b-instruct:free",
    },
    {
        "name": "openai",
        "url": "https://api.openai.com/v1/chat/completions",
        "key_env": "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
    },
    {
        "name": "anthropic",
        "url": "https://api.anthropic.com/v1/messages",
        "key_env": "ANTHROPIC_API_KEY",
        "default_model": "claude-3-5-haiku-20241022",
        "extra_headers": {"anthropic-version": "2023-06-01"},
        "anthropic_format": True,
    },
    {
        "name": "ollama",
        "url": "http://localhost:11434/v1/chat/completions",
        "key_env": None,
        "default_model": "llama3",
    },
]


KIRO_TMUX = "kiro-proxy"  # tmux session name for persistent kiro
KIRO_SESSIONS_DIR = Path.home() / ".kiro/sessions/cli"


def ensure_kiro_session():
    """Start kiro in a persistent tmux session if not already running."""
    result = subprocess.run(["tmux", "has-session", "-t", KIRO_TMUX],
                            capture_output=True)
    if result.returncode != 0:
        subprocess.run(["tmux", "new-session", "-d", "-s", KIRO_TMUX], check=True)
        subprocess.run(["tmux", "send-keys", "-t", KIRO_TMUX,
                        f"{Path.home()}/.local/bin/kiro chat --trust-all-tools", "Enter"])
        time.sleep(5)  # wait for kiro to start


async def kiro_query(prompt: str, timeout: int = 60):
    """Send prompt to kiro via tmux, wait for response in session file."""
    try:
        ensure_kiro_session()
    except Exception as e:
        log.warning(f"kiro session start failed: {e}")
        return None

    # Record current newest session file and its size
    session_files = sorted(KIRO_SESSIONS_DIR.glob("*.jsonl"),
                           key=lambda f: f.stat().st_mtime, reverse=True)
    watch_file = session_files[0] if session_files else None
    start_size = watch_file.stat().st_size if watch_file else 0

    # Send prompt to kiro
    safe_prompt = prompt.replace("'", "'\\''")
    subprocess.run(["tmux", "send-keys", "-t", KIRO_TMUX, safe_prompt, "Enter"])

    # Poll for new assistant message in session file
    deadline = time.time() + timeout
    while time.time() < deadline:
        await asyncio.sleep(1)
        # Re-check for newest file (kiro may create a new session)
        files = sorted(KIRO_SESSIONS_DIR.glob("*.jsonl"),
                       key=lambda f: f.stat().st_mtime, reverse=True)
        if not files:
            continue
        current_file = files[0]
        current_size = current_file.stat().st_size

        if current_file != watch_file or current_size > start_size:
            # Read new lines
            try:
                with open(current_file) as f:
                    lines = f.readlines()
                # Find last assistant message after our prompt
                for line in reversed(lines):
                    try:
                        d = json.loads(line)
                        if d.get("kind") == "AssistantMessage":
                            content_parts = d.get("data", {}).get("content", [])
                            if isinstance(content_parts, list):
                                text = " ".join(
                                    c.get("data", "") for c in content_parts
                                    if isinstance(c, dict) and c.get("kind") == "text"
                                ).strip()
                            else:
                                text = str(content_parts)
                            if text:
                                return text
                    except Exception:
                        pass
            except Exception:
                pass
    return None


def get_provider_for_model(model: str):
    """Pick provider based on model name prefix or fall back to first available."""
    model_map = {
        "gpt": "openai", "claude": "anthropic", "gemini": "gemini",
        "llama": "groq", "groq": "groq", "kiro": "groq",
        "openrouter": "openrouter", "ollama": "ollama",
    }
    for prefix, name in model_map.items():
        if model.lower().startswith(prefix):
            for p in PROVIDERS:
                if p["name"] == name and (p["key_env"] is None or os.environ.get(p["key_env"])):
                    return p
    # First available
    for p in PROVIDERS:
        if p["key_env"] is None or os.environ.get(p["key_env"]):
            return p
    return None


async def call_provider(provider: dict, body: dict) -> dict:
    key = os.environ.get(provider["key_env"]) if provider["key_env"] else "ollama"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {key}"}
    if provider.get("extra_headers"):
        headers.update(provider["extra_headers"])

    # Anthropic needs different request format
    if provider.get("anthropic_format"):
        messages = body.get("messages", [])
        system = next((m["content"] for m in messages if m["role"] == "system"), None)
        user_msgs = [m for m in messages if m["role"] != "system"]
        payload = {
            "model": body.get("model", provider["default_model"]),
            "max_tokens": body.get("max_tokens", 1024),
            "messages": user_msgs,
        }
        if system:
            payload["system"] = system
    else:
        payload = {**body, "model": provider.get("default_model", body.get("model", ""))}

    timeout = ClientTimeout(total=60)
    async with ClientSession(timeout=timeout) as session:
        async with session.post(provider["url"], json=payload, headers=headers) as resp:
            result = await resp.json()
            if resp.status != 200:
                raise Exception(f"HTTP {resp.status}: {result}")
            # Normalise Anthropic response to OpenAI format
            if provider.get("anthropic_format"):
                return {
                    "choices": [{"message": {"role": "assistant",
                                             "content": result["content"][0]["text"]}}],
                    "model": result.get("model", provider["default_model"]),
                }
            return result


async def chat_completions(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    model = body.get("model", "")
    
    # Route to kiro tmux session if model is "kiro"
    if model in ("kiro", "kiro-cli"):
        messages = body.get("messages", [])
        prompt = messages[-1].get("content", "") if messages else ""
        response = await kiro_query(prompt)
        if response:
            log.info("Served via kiro-tmux")
            return web.json_response({
                "choices": [{"message": {"role": "assistant", "content": response}}],
                "model": "kiro", "x_provider": "kiro-tmux"
            })
        log.warning("kiro-tmux failed, falling back to API providers")

    provider = get_provider_for_model(model)
    if not provider:
        return web.json_response({"error": "No providers available — set at least one API key"}, status=503)

    # Try provider, fall through to next on failure
    tried = set()
    for p in [provider] + [p for p in PROVIDERS if p != provider]:
        if p["name"] in tried:
            continue
        if p["key_env"] and not os.environ.get(p["key_env"]):
            continue
        tried.add(p["name"])
        try:
            result = await call_provider(p, body)
            result["x_provider"] = p["name"]
            log.info(f"Served via {p['name']} model={body.get('model','?')}")
            return web.json_response(result)
        except Exception as e:
            log.warning(f"Provider {p['name']} failed: {e}")

    return web.json_response({"error": "All providers failed"}, status=503)


async def health(request):
    available = [p["name"] for p in PROVIDERS
                 if p["key_env"] is None or os.environ.get(p["key_env"])]
    return web.json_response({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "machine": socket.gethostname(),
        "providers_available": available,
        "version": "1.1.0",
    })


async def start_server(port):
    app = web.Application()
    app.router.add_post("/v1/chat/completions", chat_completions)
    app.router.add_post("/v1/completions", chat_completions)
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
    log.info(f"Sub-proxy ready. Providers: {[p['name'] for p in PROVIDERS if p['key_env'] is None or os.environ.get(p['key_env'])]}")
    try:
        await asyncio.Event().wait()
    finally:
        for r in runners:
            await r.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
