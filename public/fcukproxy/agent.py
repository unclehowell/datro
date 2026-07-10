#!/usr/bin/env python3
import asyncio
import json
import logging
import os
import random
import shutil
import socket
import struct
import subprocess
import sys
import time
import uuid
from collections import OrderedDict
from pathlib import Path

try:
    from aiohttp import web, ClientSession, ClientTimeout, MultipartWriter
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "-q"])
    from aiohttp import web, ClientSession, ClientTimeout

logging.basicConfig(level=logging.INFO, format="%(asctime)s [FCUK-PROXY] %(message)s")
log = logging.getLogger(__name__)

INSTALL_DIR = Path.home() / ".fcukproxy"
CONFIG_FILE = INSTALL_DIR / "machine.json"
ENV_FILE = INSTALL_DIR / ".env"
PROXY_PORT = 6000
MCAST_GRP = "239.255.255.250"
MCAST_PORT = 6002
PARENT_URLS = [
    "https://www.financecheque.uk/api/proxy",
    "https://financecheque.uk/api/proxy",
]
POLL_INTERVAL = 2

# strip ANSI escape codes from CLI output
_ANSI_RE = __import__('re').compile(r'\x1b\[[0-9;]*[a-zA-Z]|\x1b\][0-9;]*[a-zA-Z]|\x1b[\[\]()#][0-9;]*[^\x1b]*')
def strip_ansi(text: str) -> str:
    return _ANSI_RE.sub('', text).strip()
VERSION = "0.4.0"

log = logging.getLogger(__name__)

_parent_index = 0

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    cfg = {
        "machine_id": str(uuid.uuid4()),
        "machine_name": socket.gethostname(),
        "local_ip": "127.0.0.1",
        "proxy_port": PROXY_PORT,
        "parent": PARENT_URLS[0],
        "version": VERSION,
    }
    INSTALL_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    return cfg

def load_env_keys():
    keys = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    keys[k.strip()] = v.strip()
    for key, value in os.environ.items():
        if key.endswith("_API_KEY") or key in ("HF_TOKEN", "GOOGLE_API_KEY"):
            keys[key] = value
    return keys

CONFIG = load_config()
ENV_KEYS = load_env_keys()

# Cache backend API URL for CLI tools (read from their config, not probed)
_cli_backend_info: dict[str, str] = {}
def _load_cli_backend_info():
    try:
        for f in sorted(Path(Path.home() / ".kiro" / "settings").glob("cli*.json")):
            if not f.name.endswith(".tmp"):
                data = json.loads(f.read_text())
                url = data.get("apiBaseUrl", "")
                if url:
                    _cli_backend_info.setdefault("kiro", url)
                    break
    except Exception:
        pass
_load_cli_backend_info()

async def _probe_kiro_backend():
    """Probe kiro's API to learn its default routing path for breadcrumb."""
    url = _cli_backend_info.get("kiro")
    if not url:
        return
    try:
        async with ClientSession(timeout=ClientTimeout(total=5)) as s:
            async with s.post(
                f"{url}/chat/completions",
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}]},
            ) as r:
                if r.status == 200:
                    data = await r.json()
                    proxy_info = data.get("_proxy", {})
                    if proxy_info:
                        _cli_backend_info["kiro_routed"] = proxy_info.get("routed", "unknown")
                        log.info(f"Kiro backend routes to: {_cli_backend_info['kiro_routed']}")
    except Exception as e:
        log.debug(f"Kiro backend probe failed: {e}")

peers: dict[str, dict] = {}
stats = {"requests": 0, "routed_to_parent": 0, "routed_to_peer": 0,
         "routed_local": 0, "errors": 0}
start_time = time.time()

# Architecture manifest — every response carries this so clients know their role
_ARCH_INFO = {
    "role": "child_proxy",
    "node_id": CONFIG["machine_id"],
    "node_name": CONFIG["machine_name"],
    "parent": PARENT_URLS[0],
    "version": VERSION,
}

# Session tracking for breadcrumb on first request
_session_first: OrderedDict[tuple[str, str], float] = OrderedDict()
_SESSION_TIMEOUT = 300  # 5 minutes

def _detect_client_type(request: web.Request) -> str:
    ua = request.headers.get("User-Agent", "").lower()
    if "openai/python" in ua or ("httpx" in ua and "python" in ua):
        return "CLI"
    elif "curl" in ua or "wget" in ua:
        return "API"
    elif request.headers.get("X-Chat-Only", "").lower() == "true":
        return "IDE"
    return "API"

def _is_first_request(request: web.Request) -> bool:
    key = (request.remote or "0.0.0.0", request.headers.get("User-Agent", ""))
    now = time.time()
    # Prune stale entries
    while _session_first and next(iter(_session_first.values())) < now - _SESSION_TIMEOUT:
        _session_first.popitem(last=False)
    last = _session_first.get(key)
    if last is None or (now - last) > _SESSION_TIMEOUT:
        _session_first[key] = now
        return True
    return False

MODELS = [
    {"id": "proxy-router", "object": "model", "created": int(time.time()), "owned_by": "fcuk-proxy"},
    {"id": "llama-3.3-70b-versatile", "object": "model", "created": int(time.time()), "owned_by": "groq"},
    {"id": "llama3.1-8b", "object": "model", "created": int(time.time()), "owned_by": "cerebras"},
    {"id": "gemini-2.0-flash", "object": "model", "created": int(time.time()), "owned_by": "google"},
    {"id": "meta-llama/Meta-Llama-3-70B-Instruct", "object": "model", "created": int(time.time()), "owned_by": "hyperbolic"},
    {"id": "meta-llama/Meta-Llama-3.1-70B-Instruct", "object": "model", "created": int(time.time()), "owned_by": "deepinfra"},
    {"id": "deepseek-chat", "object": "model", "created": int(time.time()), "owned_by": "deepseek"},
    {"id": "openrouter/auto", "object": "model", "created": int(time.time()), "owned_by": "openrouter"},
    {"id": "mistral-small-latest", "object": "model", "created": int(time.time()), "owned_by": "mistral"},
    {"id": "accounts/fireworks/models/llama-v3p1-8b-instruct", "object": "model", "created": int(time.time()), "owned_by": "fireworks"},
    {"id": "command-r", "object": "model", "created": int(time.time()), "owned_by": "cohere"},
    {"id": "glm-4-flash", "object": "model", "created": int(time.time()), "owned_by": "glm"},
    {"id": "claude-3-haiku-20240307", "object": "model", "created": int(time.time()), "owned_by": "anthropic"},
    {"id": "gpt-4o-mini", "object": "model", "created": int(time.time()), "owned_by": "openai"},
    {"id": "gpt-4o", "object": "model", "created": int(time.time()), "owned_by": "openai"},
]

PROVIDERS = [
    # Most agentic-capable first, free/cheap fallbacks last — mixed via round-robin shuffle
    {"name": "openai", "key": "OPENAI_API_KEY", "url": "https://api.openai.com/v1/chat/completions", "model": "gpt-4o-mini"},
    {"name": "openrouter", "key": "OPENROUTER_API_KEY", "url": "https://openrouter.ai/api/v1/chat/completions", "model": "openrouter/auto"},
    {"name": "anthropic", "key": "ANTHROPIC_API_KEY", "url": "https://api.anthropic.com/v1/messages", "model": "claude-3-haiku-20240307", "anthropic": True},
    {"name": "groq", "key": "GROQ_API_KEY", "url": "https://api.groq.com/openai/v1/chat/completions", "model": "llama-3.3-70b-versatile"},
    {"name": "gemini", "key": "GOOGLE_API_KEY", "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", "model": "gemini-2.0-flash"},
    {"name": "deepseek", "key": "DEEPSEEK_API_KEY", "url": "https://api.deepseek.com/v1/chat/completions", "model": "deepseek-chat"},
    {"name": "mistral", "key": "MISTRAL_API_KEY", "url": "https://api.mistral.ai/v1/chat/completions", "model": "mistral-small-latest"},
    {"name": "cerebras", "key": "CEREBRAS_API_KEY", "url": "https://api.cerebras.ai/v1/chat/completions", "model": "llama3.1-8b"},
    {"name": "deepinfra", "key": "DEEPINFRA_API_KEY", "url": "https://api.deepinfra.com/v1/openai/chat/completions", "model": "meta-llama/Meta-Llama-3.1-70B-Instruct"},
    {"name": "fireworks", "key": "FIREWORKS_API_KEY", "url": "https://api.fireworks.ai/inference/v1/chat/completions", "model": "accounts/fireworks/models/llama-v3p1-8b-instruct"},
    {"name": "cohere", "key": "COHERE_API_KEY", "url": "https://api.cohere.ai/v1/chat/completions", "model": "command-r"},
    {"name": "glm", "key": "GLM_API_KEY", "url": "https://open.bigmodel.cn/api/paas/v4/chat/completions", "model": "glm-4-flash"},
    {"name": "hyperbolic", "key": "HYPERBOLIC_API_KEY", "url": "https://api.hyperbolic.xyz/v1/chat/completions", "model": "meta-llama/Meta-Llama-3-70B-Instruct"},
]

_ROUND_ROBIN = 0

# Provider health tracking — cooldown exhausted/failing providers so they're skipped
_provider_cooldown: dict[str, float] = {}  # name → unix timestamp when cooldown expires
_provider_failures: dict[str, int] = {}    # name → consecutive failure count
FAILURE_COOLDOWN_BASE = 60                 # seconds to cooldown after 1 failure
FAILURE_COOLDOWN_MAX = 600                 # max cooldown (10 min) after many failures
MAX_FAILURES_FOR_ESCALATION = 5            # consecutive failures before max cooldown

def _cooldown_provider(name: str, status_code: int | None = None):
    """Mark a provider as cooldowned so it's skipped for a while."""
    fails = _provider_failures.get(name, 0) + 1
    _provider_failures[name] = fails
    cooldown = min(
        FAILURE_COOLDOWN_BASE * fails,
        FAILURE_COOLDOWN_MAX
    )
    if status_code and status_code in (429, 402, 403):
        cooldown = min(cooldown, 300)  # rate limit / auth: 5 min max
    _provider_cooldown[name] = time.time() + cooldown
    log.warning(f"Cooldowned {name} for {cooldown}s (failure #{fails}, status={status_code})")

def _is_provider_healthy(name: str) -> bool:
    """Check if a provider is not in cooldown."""
    expiry = _provider_cooldown.get(name)
    if expiry is None:
        return True
    if time.time() >= expiry:
        del _provider_cooldown[name]
        _provider_failures.pop(name, None)
        log.info(f"Provider {name} cooldown expired, retrying")
        return True
    return False

def _refresh_env_keys():
    """Hot-reload ENV_KEYS from disk without restarting."""
    global ENV_KEYS
    new_keys = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    new_keys[k.strip()] = v.strip()
    for key, value in os.environ.items():
        if key.endswith("_API_KEY") or key in ("HF_TOKEN", "GOOGLE_API_KEY"):
            new_keys[key] = value
    old = set(ENV_KEYS.keys())
    new = set(new_keys.keys())
    if old != new:
        log.info(f"Env keys changed: +{new-old} -{old-new}")
    ENV_KEYS = new_keys

async def periodic_refresh_env():
    """Reload .env every 60s so new API keys are picked up without restart."""
    while True:
        await asyncio.sleep(60)
        _refresh_env_keys()

def _gather_provider_info() -> list[dict]:
    providers = []
    for name, key in ENV_KEYS.items():
        if not key:
            continue
        if name.endswith("_API_KEY"):
            prov_name = name.replace("_API_KEY", "").lower()
            key_prefix = key[:8] + "..." if len(key) > 8 else ""
            models = []
            for m in PROVIDERS:
                if m["key"] == name:
                    models.append(m["model"])
            if not models:
                models = [prov_name]
            providers.append({
                "name": prov_name,
                "key_prefix": key_prefix,
                "models": models,
                "quota_remaining": None,
                "quota_limit": None,
            })
    return providers

def _gather_hermes_info() -> dict:
    hermes_skills_dir = os.path.expanduser("~/.hermes/skills")
    brain_dir = os.path.expanduser("~/brain")
    tools = 0
    mcps = 0
    harnesses = 0
    loops = 0
    cronjobs = 0
    memory_files = 0
    llmwiki_notes = 0
    if os.path.isdir(hermes_skills_dir):
        tools = sum(1 for d in os.listdir(hermes_skills_dir)
                    if os.path.isdir(os.path.join(hermes_skills_dir, d))
                    and not d.startswith("."))
    hermes_config_dir = os.path.expanduser("~/.hermes")
    if os.path.isdir(os.path.join(hermes_config_dir, "mcp")):
        mcps = len(os.listdir(os.path.join(hermes_config_dir, "mcp")))
    elif os.path.isfile(os.path.join(hermes_config_dir, "config.yaml")):
        mcps = 1
    import subprocess as sp
    try:
        r = sp.run(["systemctl", "list-timers", "--no-pager", "--no-legend"], capture_output=True, text=True, timeout=5)
        if "hermes" in r.stdout.lower():
            harnesses = r.stdout.lower().count("hermes")
    except:
        pass
    try:
        r = sp.run(["crontab", "-l"], capture_output=True, text=True, timeout=5)
        cronjobs = len([l for l in r.stdout.splitlines() if l.strip() and not l.startswith("#")])
    except:
        pass
    if os.path.isdir(os.path.expanduser("~/brain/Personal/Memory")):
        memory_files = len([f for f in os.listdir(os.path.expanduser("~/brain/Personal/Memory")) if f.endswith(".md")])
    if os.path.isdir(os.path.expanduser("~/brain/Projects/llmwiki")):
        llmwiki_notes = len([f for f in os.listdir(os.path.expanduser("~/brain/Projects/llmwiki")) if f.endswith(".md")])
    return {
        "tools": tools,
        "mcps": mcps,
        "harnesses": harnesses,
        "loops": loops,
        "cronjobs": cronjobs,
        "memory_files": memory_files,
        "llmwiki_notes": llmwiki_notes,
    }

async def register_with_parent():
    try:
        public_ip = "unknown"
        try:
            async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                async with s.get("https://api.ipify.org?format=json") as r:
                    data = await r.json()
                    public_ip = data.get("ip", "unknown")
        except Exception:
            pass
        payload = {
            "machine_id": CONFIG["machine_id"],
            "machine_name": CONFIG["machine_name"],
            "ip_address": public_ip,
            "proxy_port": CONFIG["proxy_port"],
            "version": CONFIG["version"],
            "provider_info": json.dumps(_gather_provider_info()),
            "hermes_info": json.dumps(_gather_hermes_info()),
        }
        for parent in PARENT_URLS:
            try:
                async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                    async with s.post(
                        f"{parent}/register",
                        json=payload,
                        headers={"X-Machine-ID": CONFIG["machine_id"]},
                    ) as r:
                        if r.status == 200:
                            log.info(f"Registered with {parent}")
                            break
                        else:
                            log.warning(f"{parent} registration failed: {r.status}")
            except Exception as e:
                log.debug(f"Could not register with {parent}: {e}")
    except Exception as e:
        log.warning(f"Registration error: {e}")

async def periodic_register():
    while True:
        await register_with_parent()
        await asyncio.sleep(60)

_polled_work_ids: set[str] = set()

async def poll_parent():
    while True:
        for parent in PARENT_URLS:
            try:
                async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                    async with s.get(
                        f"{parent}/poll",
                        params={"machine_id": CONFIG["machine_id"]},
                    ) as r:
                        if r.status == 200:
                            data = await r.json()
                            if data.get("pending") and data.get("work_id"):
                                wid = data["work_id"]
                                if wid in _polled_work_ids:
                                    continue
                                _polled_work_ids.add(wid)
                                payload = data.get("payload", {})
                                log.info(f"Polled work {wid} from parent")
                                result = await route_llm(payload)
                                await post_result(parent, wid, result)
            except Exception as e:
                log.debug(f"Poll {parent} failed: {e}")
        await asyncio.sleep(POLL_INTERVAL)

async def post_result(parent_url: str, work_id: str, result: dict):
    try:
        async with ClientSession(timeout=ClientTimeout(total=5)) as s:
            await s.post(
                f"{parent_url}/result",
                json={
                    "machine_id": CONFIG["machine_id"],
                    "work_id": work_id,
                    "result": result,
                },
            )
    except Exception as e:
        log.warning(f"Failed to post result for {work_id}: {e}")

async def bpdu_sender():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    payload = json.dumps({
        "machine_id": CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "ip": CONFIG["local_ip"],
        "port": PROXY_PORT,
        "version": VERSION,
    }).encode()
    while True:
        try:
            sock.sendto(payload, (MCAST_GRP, MCAST_PORT))
        except Exception:
            pass
        await asyncio.sleep(5)

async def bpdu_listener():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind(("", MCAST_PORT))
        mreq = struct.pack("4sL", socket.inet_aton(MCAST_GRP), socket.INADDR_ANY)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
    except Exception as e:
        log.warning(f"Multicast listener failed: {e}")
        return
    sock.setblocking(False)
    loop = asyncio.get_event_loop()
    while True:
        try:
            data = await loop.sock_recv(sock, 1024)
            peer = json.loads(data)
            mid = peer.get("machine_id")
            if mid and mid != CONFIG["machine_id"]:
                peers[mid] = {**peer, "last_seen": time.time()}
        except Exception:
            pass
        await asyncio.sleep(0.1)

async def peer_reaper():
    while True:
        cutoff = time.time() - 30
        stale = [k for k, v in peers.items() if v["last_seen"] < cutoff]
        for k in stale:
            del peers[k]
        await asyncio.sleep(10)


# ── CLI-based free providers (no env API keys needed if CLIs are auth'd via login) ──
def _clean(text: str) -> str:
    """Strip ANSI, collapse whitespace, return the actual response content."""
    cleaned = strip_ansi(text)
    lines = [l.strip() for l in cleaned.split('\n') if l.strip()]
    # take the first substantive line that isn't purely metadata
    skip_prefixes = ('•', '▸', '──', '┊', '━━', '━', 'Credits:', 'Time:')
    for line in lines:
        if line.startswith('> '):
            line = line[2:].strip()
        if line and not any(line.startswith(p) for p in skip_prefixes):
            return line[:2000]
    return lines[-1][:2000] if lines else cleaned[:2000]

def _parse_opencode(text: str) -> str:
    """Strip ANSI from opencode output, return first non-empty content line."""
    cleaned = strip_ansi(text)
    lines = [l.strip() for l in cleaned.split('\n') if l.strip() and not l.strip().startswith('>')]
    # skip metadata lines like "> build · big-pickle"
    for line in lines:
        if line and not line.startswith('>'):
            return line[:2000]
    return lines[-1][:2000] if lines else cleaned[:2000]

CLI_PROVIDERS = [
    # kiro — fastest, most agentic CLI, responsive and exits cleanly
    {"name": "kiro", "cmd": "kiro", "args": ["chat", "--no-interactive"], "prompt_pos": -1, "parse": _clean},
    # opencode — highly agentic coding assistant, slower startup but capable fallback
    {"name": "opencode", "cmd": "opencode", "args": ["run"], "prompt_pos": -1, "parse": _parse_opencode},
]

async def try_cli_chat(prompt: str) -> dict | None:
    """Try available CLIs in parallel — first to respond wins. Returns dict with _source and choices."""
    full_prompt = prompt
    env = os.environ.copy()
    # Strip proxy-redirecting env vars to prevent circular routing
    for key in list(env.keys()):
        if key.endswith("_BASE_URL") or key.endswith("_API_KEY"):
            if "localhost" in env.get(key, "") or "fcuk" in env.get(key, "").lower():
                del env[key]
    for pth in [os.path.expanduser("~/.npm-global/bin"), os.path.expanduser("~/.local/bin"), os.path.expanduser("~/.opencode/bin"), "/usr/local/bin"]:
        if os.path.isdir(pth):
            env["PATH"] = f"{pth}:{env.get('PATH','')}"

    async def _try_one(prov: dict) -> dict | None:
        cmd_path = prov["cmd"]
        if not shutil.which(cmd_path, path=env["PATH"]):
            return None
        args = list(prov.get("args", []))
        proc_args = [cmd_path] + args
        if prov.get("prompt_pos") == -1:
            proc_args.append(full_prompt)
        try:
            proc = await asyncio.create_subprocess_exec(
                *proc_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                stdin=asyncio.subprocess.DEVNULL,
                env=env,
                cwd=os.path.expanduser("~"),
            )
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=12)
            except asyncio.TimeoutError:
                log.warning(f"CLI {prov['name']} timed out (12s)")
                proc.kill()
                await proc.wait()
                return None
            out = (stdout.decode() if stdout else "") + (stderr.decode() if stderr else "")
            if proc.returncode == 0 and out.strip():
                cleaned = prov["parse"](out)
                if cleaned and len(cleaned) > 0 and "error" not in cleaned.lower()[:50]:
                    log.info(f"CLI success via {prov['name']}")
                    bc = prov['name']
                    if prov["name"] in _cli_backend_info:
                        bc += f" → {_cli_backend_info[prov['name']]}"
                        routed = _cli_backend_info.get("kiro_routed")
                        if routed:
                            bc += f" → parent"
                    return {
                        "_source": f"cli:{prov['name']}",
                        "_breadcrumb": bc,
                        "choices": [{"index": 0, "message": {"role": "assistant", "content": cleaned[:2000]}, "finish_reason": "stop"}]
                    }
        except FileNotFoundError:
            return None
        except Exception as e:
            log.warning(f"CLI {prov['name']} failed: {type(e).__name__}: {e}")
            return None
        return None

    tasks = [asyncio.create_task(_try_one(prov)) for prov in CLI_PROVIDERS]
    if not tasks:
        return None

    try:
        done, pending = await asyncio.wait(
            tasks, timeout=15,
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in done:
            result = task.result()
            if result:
                for t in pending:
                    t.cancel()
                if pending:
                    await asyncio.wait(pending, timeout=2)
                return result
        if pending:
            done2, pending2 = await asyncio.wait(
                pending, timeout=5,
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in done2:
                result = task.result()
                if result:
                    for t in pending2:
                        t.cancel()
                    if pending2:
                        await asyncio.wait(pending2, timeout=2)
                    return result
            for t in pending2:
                t.cancel()
            if pending2:
                await asyncio.wait(pending2, timeout=2)
    except asyncio.TimeoutError:
        pass

    for t in tasks:
        if not t.done():
            t.cancel()
    if tasks:
        await asyncio.wait(tasks, timeout=2)
    return None

async def _try_one_provider(prov: dict, messages: list[dict], effective_model: str) -> dict | None:
    """Try a single provider. Returns result dict or None on failure."""
    api_key = ENV_KEYS.get(prov["key"])
    if not api_key or not _is_provider_healthy(prov["name"]):
        return None
    try:
        if prov.get("anthropic"):
            async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                payload = {"model": effective_model, "messages": messages, "max_tokens": 1024}
                async with s.post(prov["url"], json=payload,
                    headers={"x-api-key": api_key, "Content-Type": "application/json", "anthropic-version": "2023-06-01"}) as r:
                    if r.status != 200:
                        _cooldown_provider(prov["name"], r.status)
                        return None
                    data = await r.json()
                    result = {"choices": [{"index": 0, "message": {"role": "assistant",
                        "content": data.get("content", [{"text": ""}])[0].get("text", "")}, "finish_reason": "stop"}]}
                    result["_source"] = f"provider:{prov['name']}"
                    result["_breadcrumb"] = f"{prov['name']} ({effective_model})"
                    _provider_failures.pop(prov["name"], None)
                    return result
        elif prov["name"] == "gemini":
            async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                contents = [{"role": m["role"], "parts": [{"text": m["content"]}]} for m in messages]
                async with s.post(f"{prov['url']}?key={api_key}", json={"contents": contents}) as r:
                    if r.status != 200:
                        _cooldown_provider(prov["name"], r.status)
                        return None
                    data = await r.json()
                    text = ""
                    try:
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                    except (KeyError, IndexError):
                        text = json.dumps(data)
                    result = {"choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}]}
                    result["_source"] = f"provider:{prov['name']}"
                    result["_breadcrumb"] = f"{prov['name']} ({effective_model})"
                    _provider_failures.pop(prov["name"], None)
                    return result
        else:
            async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                payload = {"model": effective_model, "messages": messages}
                async with s.post(prov["url"], json=payload,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}) as r:
                    if r.status != 200:
                        _cooldown_provider(prov["name"], r.status)
                        return None
                    _provider_failures.pop(prov["name"], None)
                    result = await r.json()
                    result["_source"] = f"provider:{prov['name']}"
                    result["_breadcrumb"] = f"{prov['name']} ({effective_model})"
                    return result
    except (asyncio.TimeoutError, Exception) as e:
        log.debug(f"{prov['name']} route failed: {type(e).__name__}")
        _cooldown_provider(prov["name"])
        return None

async def route_to_provider(messages: list[dict], model: str = None) -> dict:
    global _ROUND_ROBIN
    use_provider_model = (not model or model in ("proxy-router", "openrouter/auto", "gpt-4o-mini"))
    # Collect all eligible providers (not cooldowned, have keys)
    eligible = []
    for i in range(len(PROVIDERS)):
        idx = (_ROUND_ROBIN + i) % len(PROVIDERS)
        prov = PROVIDERS[idx]
        api_key = ENV_KEYS.get(prov["key"])
        if api_key and _is_provider_healthy(prov["name"]):
            effective = prov["model"] if use_provider_model else model
            eligible.append((prov, effective, idx))
    # Shuffle eligible providers for true mixing — preserves best-model tokens
    random.shuffle(eligible)
    # Try batches of 4 in parallel. First successful result wins.
    for batch_start in range(0, len(eligible), 4):
        batch = eligible[batch_start:batch_start + 4]
        async def try_and_mark(p, eff, ridx):
            r = await _try_one_provider(p, messages, eff)
            return (r, ridx) if r else (None, ridx)
        tasks = [asyncio.create_task(try_and_mark(p, eff, ridx)) for p, eff, ridx in batch]
        done, _ = await asyncio.wait(tasks, timeout=6, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            result, ridx = task.result()
            if result is not None:
                _ROUND_ROBIN = (ridx + 1) % len(PROVIDERS)
                return result
        for task in tasks:
            if not task.done():
                task.cancel()
    return None

async def route_to_parent(messages: list[dict], model: str = None) -> dict:
    for parent in PARENT_URLS:
        try:
            async with ClientSession(timeout=ClientTimeout(total=8)) as s:
                async with s.post(
                    f"{parent}/v1/chat/completions",
                    json={"model": model or "proxy-router", "messages": messages},
                    headers={"X-Machine-ID": CONFIG["machine_id"]},
                ) as r:
                    if r.status == 200:
                        result = await r.json()
                        result["_source"] = "parent_proxy"
                        result["_breadcrumb"] = "parent"
                        return result
        except Exception as e:
            log.debug(f"Parent {parent} failed: {e}")
    return None

async def route_llm(payload: dict, chat_only: bool = False) -> dict:
    stats["requests"] += 1
    messages = payload.get("messages", [])
    model = payload.get("model")
    # Build plain prompt from last message
    last = ""
    if messages:
        last_msg = messages[-1]
        last = last_msg.get("content", "") if isinstance(last_msg, dict) else str(last_msg)

    # Prefer CLI tools (gemini, groq, kilo etc) for free/no-local-key usage + agentic
    if last:
        cli_reply = await try_cli_chat(last)
        if cli_reply:
            stats["routed_local"] += 1
            cli_reply["_source"] = cli_reply.get("_source", "cli")
            cli_reply["_arch"] = _ARCH_INFO
            return cli_reply

    result = await route_to_provider(messages, model)
    if result:
        stats["routed_local"] += 1
        result["_source"] = result.get("_source", "provider")
        result["_arch"] = _ARCH_INFO
        return result

    result = await route_to_parent(messages, model)
    if result:
        stats["routed_to_parent"] += 1
        result["_source"] = result.get("_source", "parent_proxy")
        result["_arch"] = _ARCH_INFO
        return result

    for mid, peer in list(peers.items()):
        try:
            async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                headers = {"X-Chat-Only": "true"} if chat_only else {}
                async with s.post(
                    f"http://{peer['ip']}:{peer['port']}/v1/chat/completions",
                    json=payload,
                    headers=headers,
                ) as r:
                    if r.status == 200:
                        stats["routed_to_peer"] += 1
                        result = await r.json()
                        result["_source"] = f"peer:{peer.get('machine_name', mid)}"
                        result["_breadcrumb"] = f"peer:{peer.get('machine_name', mid)}"
                        result["_arch"] = _ARCH_INFO
                        return result
        except Exception:
            pass

    stats["errors"] += 1
    err = {
        "_source": "error",
        "_breadcrumb": "error",
        "_arch": _ARCH_INFO,
        "error": "No available LLM endpoint",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": "No LLM available. CLI tools or set API keys in ~/.fcukproxy/.env or use parent proxy."}, "finish_reason": "stop"}],
    }
    return err

async def sse_format(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

async def handle_chat_stream(payload: dict, chat_only: bool, request: web.Request) -> web.StreamResponse:
    resp = web.StreamResponse(
        status=200,
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )
    await resp.prepare(request=request)

    # Send heartbeat every 5s while waiting for LLM, so the client doesn't time out
    async def heartbeat():
        try:
            for _ in range(12):  # up to 60s
                await asyncio.sleep(5)
                await resp.write(b": heartbeat\n\n")
        except Exception:
            pass

    hb_task = asyncio.create_task(heartbeat())
    try:
        result = await route_llm(payload, chat_only)
    finally:
        hb_task.cancel()

    content = ""
    if "choices" in result and len(result["choices"]) > 0:
        content = result["choices"][0].get("message", {}).get("content", "")

    # Breadcrumb on first request: show architecture-aware routing path
    if _is_first_request(request):
        client = _detect_client_type(request)
        route = result.get("_breadcrumb") or result.get("_source", "unknown")
        node_prefix = f"{_ARCH_INFO['role']}:{_ARCH_INFO['node_name']} → {client} → "
        breadcrumb = f"[{node_prefix}{route}] "
        content = breadcrumb + content

    try:
        for word in content.split(" "):
            delta = {
                "choices": [{
                    "index": 0,
                    "delta": {"content": word + " "},
                    "finish_reason": None,
                }]
            }
            await resp.write((await sse_format(delta)).encode())
            await asyncio.sleep(0.02)

        done = {
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop",
            }]
        }
        await resp.write((await sse_format(done)).encode())
        await resp.write(b"data: [DONE]\n\n")
    except Exception:
        pass
    return resp

async def handle_chat(request: web.Request) -> web.Response:
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    chat_only = request.headers.get("X-Chat-Only", "").lower() == "true"
    stream = payload.get("stream", False)

    if stream:
        return await handle_chat_stream(payload, chat_only, request)

    result = await route_llm(payload, chat_only)
    if _is_first_request(request):
        client = _detect_client_type(request)
        route = result.get("_breadcrumb") or result.get("_source", "unknown")
        node_prefix = f"{_ARCH_INFO['role']}:{_ARCH_INFO['node_name']} → {client} → "
        breadcrumb = f"[{node_prefix}{route}] "
        if "choices" in result and len(result["choices"]) > 0:
            msg = result["choices"][0].get("message", {})
            if msg.get("content"):
                msg["content"] = breadcrumb + msg["content"]
    return web.json_response(result)

async def handle_models(request: web.Request) -> web.Response:
    return web.json_response({
        "object": "list",
        "data": MODELS,
    })

async def handle_status(request: web.Request) -> web.Response:
    return web.json_response({
        "machine_id": CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "local_ip": CONFIG["local_ip"],
        "version": VERSION,
        "uptime_s": int(time.time() - start_time),
        "peers": len(peers),
        "peer_list": [
            {"name": p["machine_name"], "ip": p["ip"], "port": p["port"]}
            for p in peers.values()
        ],
        "stats": stats,
        "parent_urls": PARENT_URLS,
        "has_api_keys": bool(ENV_KEYS),
        "configured_providers": [
            k.replace("_API_KEY", "").lower()
            for k in ENV_KEYS if k.endswith("_API_KEY")
        ],
    })

async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})

async def handle_execute(request: web.Request) -> web.Response:
    chat_only = request.headers.get("X-Chat-Only", "").lower() == "true"
    if chat_only:
        return web.json_response({
            "error": "chat_only",
            "message": "This machine is in chat-only mode. Command execution is blocked.",
        }, status=403)
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    command = body.get("command", "")
    if not command:
        return web.json_response({"error": "No command specified"}, status=400)
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=30
        )
        return web.json_response({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        })
    except subprocess.TimeoutExpired:
        return web.json_response({"error": "Command timed out"}, status=408)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_env(request: web.Request) -> web.Response:
    return web.json_response({
        "has_keys": bool(ENV_KEYS),
        "configured_providers": [
            k.replace("_API_KEY", "").lower()
            for k in ENV_KEYS if k.endswith("_API_KEY")
        ],
    })

async def handle_capabilities(request: web.Request) -> web.Response:
    return web.json_response({
        "machine_id": CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "version": VERSION,
        "providers": _gather_provider_info(),
        "hermes": _gather_hermes_info(),
    })

async def handle_root(request: web.Request) -> web.Response:
    return web.json_response({
        "service": "FCUK Proxy Agent",
        "version": VERSION,
        "machine_id": CONFIG["machine_id"],
        "endpoints": {
            "chat": "POST /v1/chat/completions",
            "models": "GET /v1/models",
            "status": "GET /status",
            "health": "GET /health",
            "env": "GET /env",
            "capabilities": "GET /v1/agent/capabilities",
            "execute": "POST /execute",
        },
        "parent_proxies": PARENT_URLS,
    })

async def main():
    app = web.Application()
    app.router.add_get("/", handle_root)
    app.router.add_post("/v1/chat/completions", handle_chat)
    app.router.add_get("/v1/models", handle_models)
    app.router.add_post("/execute", handle_execute)
    app.router.add_get("/status", handle_status)
    app.router.add_get("/health", handle_health)
    app.router.add_get("/env", handle_env)
    app.router.add_get("/v1/agent/capabilities", handle_capabilities)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PROXY_PORT)
    await site.start()
    log.info(f"FCUK Proxy v{VERSION} running on port {PROXY_PORT}")
    log.info(f"Machine ID: {CONFIG['machine_id']}")
    log.info(f"Parent proxies: {PARENT_URLS}")
    log.info(f"API keys configured: {list(ENV_KEYS.keys())}")

    await register_with_parent()
    await _probe_kiro_backend()

    await asyncio.gather(
        periodic_register(),
        periodic_refresh_env(),
        poll_parent(),
        bpdu_sender(),
        bpdu_listener(),
        peer_reaper(),
    )

if __name__ == "__main__":
    asyncio.run(main())
