#!/usr/bin/env python3
"""
PirateClaw Dashboard Server
Web UI for monitoring proxy status
"""
import os
import json
import logging
from pathlib import Path
from aiohttp import web

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pirateclaw-dashboard")

DASH_PORT = int(os.getenv("DASH_PORT", "8080"))
PROXY_PORT = int(os.getenv("PROXY_PORT", "5000"))
PARENT_PROXY = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")

STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)


async def status_handler(request):
    """Return dashboard status"""
    return web.json_response({
        "service": "pirateclaw-dashboard",
        "version": "0.0.1",
        "ports": {
            "proxy": PROXY_PORT,
            "dashboard": DASH_PORT
        },
        "parent": PARENT_PROXY,
        "status": "running"
    })


def create_app():
    app = web.Application()
    app.router.add_get("/status", status_handler)
    app.router.add_get("/", status_handler)
    app.router.add_static("/static", str(STATIC_DIR))
    return app


def main():
    app = create_app()
    logger.info(f"Starting PirateClaw dashboard on port {DASH_PORT}")
    web.run_app(app, host="0.0.0.0", port=DASH_PORT)

if __name__ == "__main__":
    main()