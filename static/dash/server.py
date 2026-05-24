#!/usr/bin/env python3
"""
Sub-proxy that runs on each machine.
Routes requests to local CLIs (groq, kilo, kiro, etc) and direct API endpoints.
Supports onboarding via API.
"""

import os
import sys
import json
import socket
import asyncio
import logging
import subprocess
import threading
from datetime import datetime
from pathlib import Path
from aiohttp import web
import aiohttp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [subproxy] %(levelname)s: %(message)s",
    handlers=[logging.FileHandler("/tmp/subproxy.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
CONFIG_DIR = BASE_DIR / "config"
PROVIDERS_FILE = CONFIG_DIR / "providers.json"
MACHINE_CONFIG_FILE = CONFIG_DIR / "machine.json"
MACHINES_FILE = CONFIG_DIR / "machines.json"


class SubProxy:
    def __init__(self, port=5000):
        self.port = port
        self.app = web.Application()
        self.app.router.add_post("/v1/chat/completions", self.chat_completions)
        self.app.router.add_post("/v1/completions", self.completions)
        self.app.router.add_get("/health", self.health)
        self.app.router.add_get("/providers", self.get_providers)
        self.app.router.add_post("/providers", self.update_providers)
        self.app.router.add_get("/machines", self.get_machines)
        self.app.router.add_post("/machines", self.update_machines)
        self.app.router.add_get("/config", self.get_config)
        self.app.router.add_post("/config", self.update_config)
        self.app.router.add_post("/admin/reload", self.reload_config)
        self.app.router.add_post("/admin/install-cli", self.install_cli)
        self.app.router.add_get("/onboarding/status", self.onboarding_status)

        self.providers = self.load_providers()
        self.machine_config = self.load_machine_config()
        self.machines = self.load_machines()

    def load_providers(self):
        if PROVIDERS_FILE.exists():
            with open(PROVIDERS_FILE) as f:
                return json.load(f)
        return self.default_providers()

    def default_providers(self):
        return {
            "opencode": {
                "type": "cli",
                "command": "opencode",
                "args": ["chat"],
                "api_key_env": None,
                "enabled": True,
                "priority": 1,
                "free": True,
            },
            "groq": {
                "type": "cli",
                "command": "groq",
                "args": ["chat"],
                "api_key_env": "GROQ_API_KEY",
                "enabled": True,
                "priority": 2,
                "free": True,
            },
            "kilo": {
                "type": "cli",
                "command": "kilo",
                "args": [],
                "api_key_env": "KILO_API_KEY",
                "enabled": True,
                "priority": 3,
                "free": True,
            },
            "kiro": {
                "type": "cli",
                "command": "kiro",
                "args": [],
                "api_key_env": "KIRO_API_KEY",
                "enabled": True,
                "priority": 4,
                "free": True,
            },
            "gemini": {
                "type": "api",
                "endpoint": "https://generativelanguage.googleapis.com/v1/models/{model}:generateContent",
                "api_key_env": "GOOGLE_API_KEY",
                "enabled": True,
                "priority": 5,
                "free": True,
            },
            "anthropic": {
                "type": "api",
                "endpoint": "https://api.anthropic.com/v1/messages",
                "api_key_env": "ANTHROPIC_API_KEY",
                "headers": {"anthropic-version": "2023-06-01"},
                "enabled": True,
                "priority": 6,
                "free": False,
            },
            "openai": {
                "type": "api",
                "endpoint": "https://api.openai.com/v1/chat/completions",
                "api_key_env": "OPENAI_API_KEY",
                "enabled": True,
                "priority": 7,
                "free": False,
            },
            "xai": {
                "type": "api",
                "endpoint": "https://api.x.ai/v1/chat/completions",
                "api_key_env": "XAI_API_KEY",
                "enabled": True,
                "priority": 8,
                "free": False,
            },
            "ollama": {
                "type": "local",
                "endpoint": "http://localhost:11434/api/generate",
                "enabled": True,
                "priority": 9,
                "free": True,
            },
        }

    def load_machine_config(self):
        if MACHINE_CONFIG_FILE.exists():
            with open(MACHINE_CONFIG_FILE) as f:
                return json.load(f)
        return self.default_machine_config()

    def default_machine_config(self):
        return {
            "machine_id": socket.gethostname(),
            "machine_name": os.environ.get("MACHINE_NAME", socket.gethostname()),
            "tailscale_ip": os.environ.get("TAILSCALE_IP", "127.0.0.1"),
            "port": self.port,
            "capabilities": ["cli", "api", "local"],
            "priority": 1,
        }

    def load_machines(self):
        if MACHINES_FILE.exists():
            with open(MACHINES_FILE) as f:
                data = json.load(f)
                return data.get("machines", [])
        return self.default_machines()

    def default_machines(self):
        return [
            {"name": "laptop", "ip": "127.0.0.1", "port": 5000, "type": "laptop"},
            {"name": "aws1", "ip": "100.64.1.2", "port": 5000, "type": "aws"},
            {"name": "aws2", "ip": "100.64.1.3", "port": 5000, "type": "aws"},
            {"name": "phone", "ip": "100.64.1.4", "port": 5000, "type": "phone"},
        ]

    def save_providers(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(PROVIDERS_FILE, "w") as f:
            json.dump(self.providers, f, indent=2)

    def save_machine_config(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(MACHINE_CONFIG_FILE, "w") as f:
            json.dump(self.machine_config, f, indent=2)

    def save_machines(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(MACHINES_FILE, "w") as f:
            json.dump({"machines": self.machines}, f, indent=2)

    async def chat_completions(self, request):
        try:
            body = await request.json()
            model = body.get("model", "groq")

            provider_name = model.split(":")[0] if ":" in model else model

            response = await self.route_request(provider_name, body)

            return web.json_response(response)
        except Exception as e:
            logger.error(f"Error in chat_completions: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def completions(self, request):
        return await self.chat_completions(request)

    async def route_request(self, provider_name, body):
        provider = self.providers.get(provider_name)

        if not provider or not provider.get("enabled", False):
            for name, prov in self.providers.items():
                if prov.get("enabled", False):
                    provider_name = name
                    provider = prov
                    break

        if not provider:
            return {"error": "No enabled providers"}

        if provider["type"] == "cli":
            return await self.handle_cli(provider, body)
        elif provider["type"] == "api":
            return await self.handle_api(provider, body)
        elif provider["type"] == "local":
            return await self.handle_local(provider, body)

        return {"error": f"Unknown provider type: {provider.get('type')}"}

    async def handle_cli(self, provider, body):
        command = provider["command"]

        try:
            messages = body.get("messages", [])
            last_message = messages[-1].get("content", "") if messages else ""

            if command == "opencode":
                result = await self.run_cli_async(
                    ["opencode", "--complete", last_message]
                )
            elif command == "groq":
                result = await self.run_cli_async(["groq", "chat", last_message])
            elif command == "kilo":
                result = await self.run_cli_async(
                    ["kilo", "complete", "--prompt", last_message]
                )
            elif command == "kiro":
                result = await self.run_cli_async(["kiro", "chat", last_message])
            else:
                result = await self.run_cli_async([command])

            return self.parse_cli_output(result, body)
        except FileNotFoundError:
            return {"error": f"CLI not found: {command}"}
        except Exception as e:
            return {"error": f"CLI error: {str(e)}"}

    async def run_cli_async(self, cmd, timeout=30):
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=os.environ.copy(),
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)

            if proc.returncode != 0:
                stderr_text = stderr.decode() if stderr else ""
                logger.warning(f"CLI returned {proc.returncode}: {stderr_text}")
                return stdout.decode() if stdout else stderr_text

            return stdout.decode() if stdout else ""
        except asyncio.TimeoutError:
            proc.kill()
            return "CLI timeout"
        except Exception as e:
            return f"Error: {str(e)}"

    async def handle_api(self, provider, body):
        endpoint = provider["endpoint"]
        api_key = os.environ.get(provider["api_key_env"])

        if not api_key:
            return {"error": f"API key not set: {provider['api_key_env']}"}

        model = body.get("model", "gemini-2.0-flash")
        endpoint = endpoint.replace("{model}", model)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if provider.get("headers"):
            headers.update(provider["headers"])

        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, json=body, headers=headers) as resp:
                result = await resp.json()
                return result

    async def handle_local(self, provider, body):
        endpoint = provider["endpoint"]
        model = body.get("model", "llama3")

        payload = {
            "model": model,
            "prompt": body.get("messages", [{}])[-1].get("content", ""),
            "stream": body.get("stream", False),
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    result = await resp.json()

                    if "response" in result:
                        return {
                            "choices": [
                                {
                                    "message": {
                                        "role": "assistant",
                                        "content": result["response"],
                                    }
                                }
                            ],
                            "model": model,
                        }
                    return result
        except Exception as e:
            return {"error": f"Ollama error: {str(e)}"}

    def parse_cli_output(self, output, body):
        model = body.get("model", "cli")
        return {
            "choices": [
                {"message": {"role": "assistant", "content": output or "No response"}}
            ],
            "model": model,
        }

    async def health(self, request):
        installed_clis = self.check_installed_clis()

        health = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "machine": self.machine_config,
            "providers": {
                k: v.get("enabled", False) for k, v in self.providers.items()
            },
            "installed_clis": installed_clis,
            "version": "1.0.0",
        }
        return web.json_response(health)

    def check_installed_clis(self):
        clis = {}
        for name, prov in self.providers.items():
            if prov.get("type") == "cli":
                cmd = prov.get("command", "")
                try:
                    result = subprocess.run(["which", cmd], capture_output=True)
                    clis[name] = result.returncode == 0
                except:
                    clis[name] = False
        return clis

    async def get_providers(self, request):
        return web.json_response(self.providers)

    async def update_providers(self, request):
        data = await request.json()
        self.providers = data
        self.save_providers()
        return web.json_response({"status": "saved"})

    async def get_machines(self, request):
        return web.json_response({"machines": self.machines})

    async def update_machines(self, request):
        data = await request.json()
        self.machines = data.get("machines", self.machines)
        self.save_machines()
        return web.json_response({"status": "saved"})

    async def get_config(self, request):
        return web.json_response(
            {
                "providers": self.providers,
                "machine": self.machine_config,
                "machines": self.machines,
            }
        )

    async def update_config(self, request):
        data = await request.json()
        if "providers" in data:
            self.providers = data["providers"]
            self.save_providers()
        if "machines" in data:
            self.machines = data["machines"]
            self.save_machines()
        if "machine" in data:
            self.machine_config = data["machine"]
            self.save_machine_config()
        return web.json_response({"status": "saved"})

    async def reload_config(self, request):
        self.providers = self.load_providers()
        self.machine_config = self.load_machine_config()
        self.machines = self.load_machines()
        return web.json_response({"status": "reloaded"})

    async def install_cli(self, request):
        data = await request.json()
        cli_name = data.get("cli", "")

        result = await self.install_cli_tool(cli_name)
        return web.json_response(result)

    async def install_cli_tool(self, cli_name):
        install_commands = {
            "opencode": ["npm", "install", "-g", "opencode-cli-opencode"],
            "groq": ["npm", "install", "-g", "groq-cli"],
            "kilo": ["npm", "install", "-g", "@kilo-cli/kilo"],
        }

        cmd = install_commands.get(cli_name)
        if not cmd:
            return {"success": False, "error": f"Unknown CLI: {cli_name}"}

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode == 0:
                return {"success": True, "message": f"{cli_name} installed"}
            else:
                return {"success": False, "error": stderr.decode()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def onboarding_status(self, request):
        installed = self.check_installed_clis()

        available_providers = []
        for name, prov in self.providers.items():
            if prov.get("enabled"):
                api_key = os.environ.get(prov.get("api_key_env", ""))
                available_providers.append(
                    {
                        "name": name,
                        "type": prov.get("type"),
                        "free": prov.get("free", False),
                        "cli_installed": installed.get(name, False)
                        if prov.get("type") == "cli"
                        else None,
                        "api_key_configured": bool(api_key),
                    }
                )

        return web.json_response(
            {
                "machine": self.machine_config,
                "providers": available_providers,
                "ready": len(
                    [
                        p
                        for p in available_providers
                        if p.get("cli_installed") or p.get("api_key_configured")
                    ]
                )
                > 0,
            }
        )

    def run(self):
        logger.info(f"Starting sub-proxy on port {self.port}")
        web.run_app(self.app, host="0.0.0.0", port=self.port)


if __name__ == "__main__":
    port = int(os.environ.get("SUBPROXY_PORT", 5000))
    SubProxy(port=port).run()
