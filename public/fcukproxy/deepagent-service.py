#!/usr/bin/env python3
"""DeepAgent child service — executes delegated tasks and exposes OpenAI-compatible chat."""

import json
import logging
import os
import sys
from pathlib import Path

VENV_PYTHON = Path.home() / ".fcukproxy/deepagent-venv/bin/python3"
if Path(VENV_PYTHON).exists() and sys.executable != str(VENV_PYTHON):
    os.execv(VENV_PYTHON, [VENV_PYTHON, __file__] + sys.argv[1:])

from aiohttp import web

logging.basicConfig(level=logging.INFO, format="%(asctime)s [DEEPAGENT] %(message)s")
log = logging.getLogger("deepagent")

from deepagents import create_deep_agent
from deepagents.backends import LocalShellBackend

PORT = int(os.environ.get("DEEPAGENT_PORT", "6000"))
REPO_DIR = os.environ.get("REPO_DIR", str(Path.home() / "datro"))
MACHINE_ID = os.environ.get("MACHINE_ID", "unknown")

backend = LocalShellBackend(root_dir=REPO_DIR, inherit_env=True)

agent = create_deep_agent(
    model="openrouter:auto",
    backend=backend,
    system_prompt="You are a deep agent. Execute tasks using tools. Be concise.",
)

routes = web.RouteTableDef()

@routes.get("/health")
async def health(request):
    return web.json_response({"ok": True, "service": "deepagent", "machine_id": MACHINE_ID})

@routes.get("/v1/agent/status")
async def status(request):
    return web.json_response({
        "machine_id": MACHINE_ID,
        "service": "deepagent",
        "capabilities": {"agent_exec": True, "git": True, "node": True, "deepagent": True},
        "repo_dir": REPO_DIR,
        "port": PORT,
    })

@routes.post("/v1/agent/execute")
async def execute_task(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    task = body.get("task", "").strip()
    if not task:
        return web.json_response({"error": "task is required"}, status=400)

    context = body.get("context") or {}
    branch = context.get("branch", "command")
    log.info("Received task: %s", task[:200])
    os.chdir(REPO_DIR)

    try:
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": task}]},
            config={"recursion_limit": 50},
        )
    except Exception as e:
        log.error("Agent execution failed: %s", e)
        return web.json_response({"error": str(e), "status": "failed"}, status=500)

    messages = result.get("messages", [])
    last_content = ""
    for msg in reversed(messages):
        content = msg.get("content", "")
        if isinstance(content, str) and content.strip():
            last_content = content.strip()
            break
        if isinstance(content, list):
            for block in reversed(content):
                if isinstance(block, dict) and block.get("type") == "text" and block.get("text", "").strip():
                    last_content = block["text"].strip()
                    break
            if last_content:
                break

    return web.json_response({
        "status": "completed",
        "result": last_content[:4000],
        "machine_id": MACHINE_ID,
        "branch": branch,
        "deploy_url": f"https://{branch}.datro.xyz" if branch in ("command", "financecheque") else "",
    })


@routes.post("/v1/chat/completions")
async def chat_completions(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": {"message": "Invalid JSON body", "type": "invalid_request_error"}}, status=400, content_type="application/json")

    messages = body.get("messages", [])
    user_message = ""
    for msg in reversed(messages):
        content = msg.get("content", "")
        if isinstance(content, str) and content.strip():
            user_message = content.strip()
            break
        if isinstance(content, list):
            for block in reversed(content):
                if isinstance(block, dict) and block.get("type") == "text" and block.get("text", "").strip():
                    user_message = block["text"].strip()
                    break
            if user_message:
                break

    if not user_message:
        return web.json_response({"error": {"message": "No user message found", "type": "invalid_request_error"}}, status=400, content_type="application/json")

    log.info("Chat completion: %s", user_message[:200])

    try:
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": user_message}]},
            config={"recursion_limit": 50},
        )
    except Exception as e:
        log.error("Chat completion failed: %s", e)
        return web.json_response({
            "error": {"message": str(e), "type": "internal_error"}
        }, status=500, content_type="application/json")

    reply_messages = result.get("messages", [])
    reply_text = ""
    for msg in reversed(reply_messages):
        content = msg.get("content", "")
        if isinstance(content, str) and content.strip():
            reply_text = content.strip()
            break
        if isinstance(content, list):
            for block in reversed(content):
                if isinstance(block, dict) and block.get("type") == "text" and block.get("text", "").strip():
                    reply_text = block["text"].strip()
                    break
            if reply_text:
                break

    if not reply_text:
        reply_text = "(completed with no output)"

    response = {
        "id": f"chatcmpl-deepagent-{MACHINE_ID[:8]}",
        "object": "chat.completion",
        "created": int(__import__('time').time()),
        "model": body.get("model", "deepagent-openrouter-auto"),
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": reply_text},
            "finish_reason": "stop",
        }],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        },
    }
    return web.json_response(response, content_type="application/json")


app = web.Application()
app.add_routes(routes)

if __name__ == "__main__":
    log.info("Starting DeepAgent service on port %s (repo: %s)", PORT, REPO_DIR)
    web.run_app(app, host="0.0.0.0", port=PORT, print=None)
