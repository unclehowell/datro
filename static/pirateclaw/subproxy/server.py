#!/usr/bin/env python3
"""
PirateClaw Sub-Proxy Server
Forwards LLM requests to parent proxy with fallback to local LLM (Qwen)
"""
import os
import sys
import json
import asyncio
import logging
from pathlib import Path
from aiohttp import web
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pirateclaw-subproxy")

PROXY_PORT = int(os.getenv("PROXY_PORT", "5000"))
PARENT_PROXY = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")
LOCAL_MODEL = os.getenv("LOCAL_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")

MACHINE_CONFIG = Path(__file__).parent / "config" / "machine.json"
CONFIG_DIR = Path(__file__).parent / "config"
CONFIG_DIR.mkdir(exist_ok=True)

LOCAL_MODEL_INSTANCE = None
LOCAL_TOKENIZER_INSTANCE = None


def load_config():
    if MACHINE_CONFIG.exists():
        return json.loads(MACHINE_CONFIG.read_text())
    return {"machine_id": "unknown"}


def init_local_model():
    global LOCAL_MODEL_INSTANCE, LOCAL_TOKENIZER_INSTANCE
    if LOCAL_MODEL_INSTANCE is None:
        logger.info(f"Loading local model: {LOCAL_MODEL}")
        LOCAL_TOKENIZER_INSTANCE = AutoTokenizer.from_pretrained(LOCAL_MODEL, trust_remote_code=True)
        LOCAL_MODEL_INSTANCE = AutoModelForCausalLM.from_pretrained(
            LOCAL_MODEL,
            torch_dtype=torch.float32,
            device_map="cpu"
        )
        LOCAL_MODEL_INSTANCE.eval()
        logger.info("Local model loaded")


async def generate_local_response(messages, max_tokens=180):
    if LOCAL_MODEL_INSTANCE is None:
        init_local_model()

    text = LOCAL_TOKENIZER_INSTANCE.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    inputs = LOCAL_TOKENIZER_INSTANCE([text], return_tensors="pt")

    with torch.no_grad():
        outputs = LOCAL_MODEL_INSTANCE.generate(
            **inputs,
            max_new_tokens=max_tokens,
            pad_token_id=LOCAL_TOKENIZER_INSTANCE.eos_token_id
        )

    response = LOCAL_TOKENIZER_INSTANCE.decode(outputs[0], skip_special_tokens=True)
    return response


def format_openai_response(text_response):
    return {
        "id": "chatcmpl-local",
        "object": "chat.completion",
        "created": 1234567890,
        "model": LOCAL_MODEL,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": text_response
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }


async def proxy_handler(request):
    """Handle LLM proxy requests with round-robin fallback"""
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    headers = dict(request.headers)
    headers.pop("Host", None)

    async def try_parent():
        try:
            async with request.app["client_session"].post(
                f"{PARENT_PROXY}/v1/chat/completions",
                json=body,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
        except Exception as e:
            logger.warning(f"Parent proxy failed: {e}")
        return None

    result = await try_parent()
    if result:
        return web.json_response(result)

    logger.info("Falling back to local LLM")
    messages = body.get("messages", [])
    max_tokens = body.get("max_tokens", 180)
    try:
        response_text = await generate_local_response(messages, max_tokens)
        return web.json_response(format_openai_response(response_text))
    except Exception as e:
        logger.error(f"Local LLM failed: {e}")
        return web.json_response(
            {"error": "All proxies failed", "detail": str(e)},
            status=503
        )


async def local_handler(request):
    """Direct local LLM endpoint"""
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    messages = body.get("messages", [])
    max_tokens = body.get("max_tokens", 180)
    try:
        response_text = await generate_local_response(messages, max_tokens)
        return web.json_response(format_openai_response(response_text))
    except Exception as e:
        logger.error(f"Local LLM error: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def health_handler(request):
    """Health check endpoint"""
    return web.json_response({
        "status": "ok",
        "machine": load_config(),
        "parent": PARENT_PROXY,
        "local_model": LOCAL_MODEL,
        "model_loaded": LOCAL_MODEL_INSTANCE is not None
    })


def create_app():
    app = web.Application()
    app["client_session"] = None

    app.router.add_post("/v1/chat/completions", proxy_handler)
    app.router.add_post("/v1/chat/completions/local", local_handler)
    app.router.add_get("/health", health_handler)
    app.router.add_get("/", health_handler)

    asyncio.get_event_loop().run_in_executor(None, init_local_model)

    return app


def main():
    import aiohttp
    app = create_app()
    logger.info(f"Starting PirateClaw sub-proxy on port {PROXY_PORT}")
    logger.info(f"Parent proxy: {PARENT_PROXY}")
    logger.info(f"Local model: {LOCAL_MODEL}")
    web.run_app(app, host="0.0.0.0", port=PROXY_PORT)

if __name__ == "__main__":
    main()