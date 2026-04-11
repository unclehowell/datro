#!/usr/bin/env python3
# Template Honcho helper for MCP server (Gemini CLI)
# Place in: ~/.gemini/mcp/honcho/honcho_tool.py

import json
import os
import sys
from pathlib import Path


def _load_env_file(path: str) -> None:
    p = Path(path).expanduser()
    if not p.exists():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def _load_honcho_json(path: str = "~/.hermes/honcho.json") -> dict:
    p = Path(path).expanduser()
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _honcho_client():
    # Prefer env var
    if "HONCHO_API_KEY" not in os.environ:
        _load_env_file("~/.hermes/honcho_api_key.env")

    if "HONCHO_API_KEY" not in os.environ:
        cfg = _load_honcho_json()
        api_key = cfg.get("apiKey")
        if isinstance(api_key, str) and api_key:
            os.environ["HONCHO_API_KEY"] = api_key

    # Workspace
    cfg = _load_honcho_json()
    workspace_id = os.environ.get("HONCHO_WORKSPACE_ID")
    if not workspace_id:
        workspace_id = cfg.get("hosts", {}).get("hermes", {}).get("workspace")
    if not workspace_id:
        workspace_id = "hermes"

    from honcho import Honcho  # provided by honcho-ai package

    return Honcho(workspace_id=str(workspace_id))


def _ok(data):
    print(json.dumps({"ok": True, **data}))
    return 0


def _bad(msg: str):
    print(json.dumps({"ok": False, "error": msg}))
    return 2


def _err(msg: str):
    print(json.dumps({"ok": False, "error": msg}))
    return 1


def main() -> int:
    if len(sys.argv) < 2:
        return _bad("missing action")

    action = sys.argv[1]
    payload = json.loads(sys.stdin.read() or "{}")

    user_peer_id = payload.get("user_peer_id", "user")
    ai_peer_id = payload.get("ai_peer_id", "gemini-cli")

    try:
        client = _honcho_client()
        ai = client.peer(ai_peer_id)
        client.peer(user_peer_id)  # ensure exists

        if action == "profile":
            card = ai.get_card(target=user_peer_id)
            return _ok({"card": card or []})

        if action == "ask":
            q = payload.get("query")
            if not q:
                return _bad("missing query")
            ans = ai.chat(str(q), target=user_peer_id)
            return _ok({"answer": ans or ""})

        if action == "search":
            q = payload.get("query")
            if not q:
                return _bad("missing query")
            top_k = int(payload.get("top_k", 10))
            distance = payload.get("max_distance", None)
            scope = ai.conclusions_of(user_peer_id)
            if distance is None:
                results = scope.query(str(q), top_k=top_k)
            else:
                results = scope.query(str(q), top_k=top_k, distance=float(distance))
            return _ok({"results": [r.content for r in results]})

        if action == "conclude":
            c = payload.get("conclusion")
            if not c:
                return _bad("missing conclusion")
            created = ai.conclusions_of(user_peer_id).create([{"content": str(c)}])
            return _ok({"created": [x.content for x in created]})

        return _bad(f"unknown action: {action}")

    except Exception as e:
        return _err(str(e))


if __name__ == "__main__":
    raise SystemExit(main())
