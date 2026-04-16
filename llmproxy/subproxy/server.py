#!/usr/bin/env python3
"""
Sub-proxy that runs on each machine.
Routes requests to local CLIs (groq, kilo, kiro, etc) and direct API endpoints.
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from aiohttp import web
import aiohttp
import subprocess
import re

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [subproxy] %(levelname)s: %(message)s",
    handlers=[logging.FileHandler("/tmp/subproxy.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

CONFIG_DIR = Path(__file__).parent / "config"
PROVIDERS_FILE = CONFIG_DIR / "providers.json"
MACHINE_CONFIG_FILE = CONFIG_DIR / "machine.json"


class SubProxy:
    def __init__(self, port=5000):
        self.port = port
        self.app = web.Application()
        self.app.router.add_post("/v1/chat/completions", self.chat_completions)
        self.app.router.add_post("/v1/completions", self.completions)
        self.app.router.add_get("/health", self.health)
        self.app.router.add_get("/providers", self.get_providers)
        self.app.router.add_post("/admin/reload", self.reload_config)

        self.providers = self.load_providers()
        self.machine_config = self.load_machine_config()

    def load_providers(self):
        if PROVIDERS_FILE.exists():
            with open(PROVIDERS_FILE) as f:
                return json.load(f)
        return self.default_providers()

    def default_providers(self):
        return {
            "groq": {
                "type": "cli",
                "command": "groq",
                "args": ["chat"],
                "api_key_env": "GROQ_API_KEY",
                "enabled": True,
            },
            "kilo": {
                "type": "cli",
                "command": "kilo",
                "args": [],
                "api_key_env": "KILO_API_KEY",
                "enabled": True,
            },
            "kiro": {
                "type": "cli",
                "command": "kiro",
                "args": [],
                "api_key_env": "KIRO_API_KEY",
                "enabled": True,
            },
            "gemini": {
                "type": "api",
                "endpoint": "https://generativelanguage.googleapis.com/v1/models/{model}:generateContent",
                "api_key_env": "GOOGLE_API_KEY",
                "enabled": True,
            },
            "anthropic": {
                "type": "api",
                "endpoint": "https://api.anthropic.com/v1/messages",
                "api_key_env": "ANTHROPIC_API_KEY",
                "headers": {"anthropic-version": "2023-06-01"},
                "enabled": True,
            },
            "openai": {
                "type": "api",
                "endpoint": "https://api.openai.com/v1/chat/completions",
                "api_key_env": "OPENAI_API_KEY",
                "enabled": True,
            },
            "xai": {
                "type": "api",
                "endpoint": "https://api.x.ai/v1/chat/completions",
                "api_key_env": "XAI_API_KEY",
                "enabled": True,
            },
            "ollama": {
                "type": "local",
                "endpoint": "http://localhost:11434/api/generate",
                "enabled": True,
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

    def save_providers(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(PROVIDERS_FILE, "w") as f:
            json.dump(self.providers, f, indent=2)

    def save_machine_config(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(MACHINE_CONFIG_FILE, "w") as f:
            json.dump(self.machine_config, f, indent=2)

    async def chat_completions(self, request):
        try:
            body = await request.json()
            model = body.get("model", "groq")

            # Extract provider from model name (e.g., "groq:llama-3.3-70b" -> "groq")
            provider_name = model.split(":")[0] if ":" in model else model

            # Route to appropriate provider
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
            # Try fallback to first enabled provider
            for name, prov in self.providers.items():
                if prov.get("enabled", False):
                    provider_name = name
                    provider = prov
                    break

        if provider["type"] == "cli":
            return await self.handle_cli(provider, body)
        elif provider["type"] == "api":
            return await self.handle_api(provider, body)
        elif provider["type"] == "local":
            return await self.handle_local(provider, body)

        raise Exception(f"Unknown provider type: {provider['type']}")

    async def handle_cli(self, provider, body):
        command = provider["command"]
        args = provider.get("args", [])

        # Build CLI command based on provider
        if command == "groq":
            cmd = ["groq", "chat"]
            messages = body.get("messages", [])
            if messages:
                cmd.append(messages[-1].get("content", ""))
        elif command == "kilo":
            cmd = ["kilo", "complete"]
            messages = body.get("messages", [])
            if messages:
                cmd.extend(["--prompt", messages[-1].get("content", "")])
        elif command == "kiro":
            cmd = ["kiro", "chat"]
            messages = body.get("messages", [])
            if messages:
                cmd.append(messages[-1].get("content", ""))
        else:
            cmd = [command] + args

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=os.environ.copy(),
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"CLI error: {stderr.decode()}")
                return {"error": f"CLI failed: {stderr.decode()}"}

            # Parse CLI output to OpenAI format
            return self.parse_cli_output(stdout.decode(), body)
        except FileNotFoundError:
            return {"error": f"CLI not found: {command}"}

    async def handle_api(self, provider, body):
        endpoint = provider["endpoint"]
        api_key = os.environ.get(provider["api_key_env"])

        if not api_key:
            return {"error": f"API key not set: {provider['api_key_env']}"}

        # Replace {model} placeholder
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

        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, json=payload) as resp:
                result = await resp.json()

                # Convert Ollama format to OpenAI format
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

    def parse_cli_output(self, output, body):
        model = body.get("model", "cli")
        return {
            "choices": [{"message": {"role": "assistant", "content": output}}],
            "model": model,
        }

    async def health(self, request):
        health = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "machine": self.machine_config,
            "providers": {
                k: v.get("enabled", False) for k, v in self.providers.items()
            },
            "version": "1.0.0",
        }
        return web.json_response(health)

    async def get_providers(self, request):
        return web.json_response(self.providers)

    async def reload_config(self, request):
        self.providers = self.load_providers()
        self.machine_config = self.load_machine_config()
        return web.json_response({"status": "reloaded"})

    def run(self):
        logger.info(f"Starting sub-proxy on port {self.port}")
        web.run_app(self.app, host="0.0.0.0", port=self.port)


if __name__ == "__main__":
    import socket

    port = int(os.environ.get("SUBPROXY_PORT", 5000))
    SubProxy(port=port).run()
