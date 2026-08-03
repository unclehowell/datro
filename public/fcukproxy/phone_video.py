#!/usr/bin/env python3
"""fcukproxy video engine — thin client for the fcukproxy scene library.

Renders animated MP4s with Pillow + ffmpeg on minimal-compute child proxies.
Scenes and objects are NOT bundled: they live in the financecheque branch at
``public/fcukproxy/library/`` and are fetched on demand from LIBRARY_URL,
then cached under ``~/.fcukproxy/library/``. A branch rerelease updates the
manifest/scenes/objects, and child proxies pick the new versions up via
``--update`` (or lazily on next render after the cache is refreshed).

Contract kept for agent.py: ``classify(prompt)``, ``render(scene, props,
duration, outpath)``, ``OUTDIR``, ``LIB_VERSION``, ``list_scenes()``,
``get_manifest()``, ``update_library()``.
"""
import io
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

W, H, FPS = 480, 270, 24
LIB_VERSION = "0.2.0"
# Where the library is served from (branch public/fcukproxy/library). Override
# with FCUK_LIBRARY_URL env (raw.githubusercontent for bleeding edge, or a local
# static server for testing).
LIBRARY_URL = os.environ.get(
    "FCUK_LIBRARY_URL",
    "https://www.financecheque.uk/fcukproxy/library",
).rstrip("/")
# Local cache dir for fetched scenes/objects/manifest.
LIB_CACHE = os.path.join(os.path.expanduser("~"), ".fcukproxy", "library")
FFMPEG = (
    shutil.which("ffmpeg")
    or "/data/data/com.termux/files/usr/bin/ffmpeg"
    or "ffmpeg"
)
OUTDIR = os.path.join(os.path.expanduser("~"), ".fcukproxy", "videos")

ACCESSORIES = ["hat", "glasses", "crown", "bowtie", "scarf"]

# Modules already loaded (name -> {"draw": fn, "META": dict}).
_SCENE_CACHE: dict = {}
_OBJECT_CACHE: dict = {}
_MANIFEST_CACHE: dict | None = None

# ─── HTTP fetch ────────────────────────────────────────────────
def _http_get(url: str, timeout: int = 15) -> str | None:
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "fcukproxy-video-engine"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:  # noqa: BLE001
        return None


# ─── library resolution ────────────────────────────────────────
def _cache_path(rel: str) -> str:
    return os.path.join(LIB_CACHE, rel)


def _source(rel: str, timeout: int = 15) -> str | None:
    """Return source for a library-relative path, from cache or network."""
    cached = _cache_path(rel)
    if os.path.exists(cached):
        try:
            with open(cached, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:  # noqa: BLE001
            pass
    src = _http_get(f"{LIBRARY_URL}/{rel}", timeout=timeout)
    if src is not None:
        try:
            os.makedirs(os.path.dirname(cached), exist_ok=True)
            with open(cached, "w", encoding="utf-8") as f:
                f.write(src)
        except Exception:  # noqa: BLE001
            pass
    return src


def get_manifest() -> dict:
    """Return the library manifest (cached; falls back to cached copy)."""
    global _MANIFEST_CACHE
    if _MANIFEST_CACHE is not None:
        return _MANIFEST_CACHE
    raw = _source("manifest.json", timeout=10)
    if raw:
        try:
            _MANIFEST_CACHE = json.loads(raw)
            return _MANIFEST_CACHE
        except Exception:  # noqa: BLE001
            pass
    # fall back to the cached manifest file directly
    cached = _cache_path("manifest.json")
    if os.path.exists(cached):
        try:
            with open(cached, "r", encoding="utf-8") as f:
                _MANIFEST_CACHE = json.load(f)
                return _MANIFEST_CACHE
        except Exception:  # noqa: BLE001
            pass
    _MANIFEST_CACHE = {
        "library_version": LIB_VERSION,
        "scenes": [{"name": "nature", "keywords": []}],
        "objects": [],
    }
    return _MANIFEST_CACHE


def list_scenes() -> list[str]:
    m = get_manifest()
    scenes = [s.get("name") for s in m.get("scenes", []) if s.get("name")]
    return scenes or ["nature"]


def update_library(timeout: int = 15) -> dict:
    """Fetch the latest manifest + all scenes + objects from the library.

    Purges the cache when the library_version changes, then re-fetches every
    scene/object so a branch rerelease propagates to all child proxies.
    """
    remote = _http_get(f"{LIBRARY_URL}/manifest.json", timeout=timeout)
    if not remote:
        return {"ok": False, "error": "could not fetch manifest", "library_version": None}
    try:
        man = json.loads(remote)
    except Exception:  # noqa: BLE001
        return {"ok": False, "error": "bad manifest json", "library_version": None}

    local_ver = None
    cached = _cache_path("manifest.json")
    if os.path.exists(cached):
        try:
            with open(cached, "r", encoding="utf-8") as f:
                local_ver = json.load(f).get("library_version")
        except Exception:  # noqa: BLE001
            pass

    if local_ver != man.get("library_version"):
        # version bumped (rerelease) → purge + re-fetch everything
        try:
            shutil.rmtree(LIB_CACHE, ignore_errors=True)
        except Exception:  # noqa: BLE001
            pass
        _SCENE_CACHE.clear()
        _OBJECT_CACHE.clear()

    _MANIFEST_CACHE = man
    os.makedirs(_cache_path("scenes"), exist_ok=True)
    os.makedirs(_cache_path("objects"), exist_ok=True)
    for rel, entries in (("scenes", man.get("scenes", [])), ("objects", man.get("objects", []))):
        for e in entries:
            name = e.get("name")
            if not name:
                continue
            _source(f"{rel}/{name}.py", timeout=timeout)
    with open(_cache_path("manifest.json"), "w", encoding="utf-8") as f:
        json.dump(man, f)
    return {"ok": True, "library_version": man.get("library_version")}


# ─── module loading ────────────────────────────────────────────
def _load_module(kind: str, name: str, cache: dict):
    if name in cache:
        return cache[name]
    rel = f"{kind}/{name}.py"
    src = _source(rel)
    if src is None:
        return None
    ns = {
        "META": {"name": name},
        "draw": None,
        "__name__": f"fcukproxy_library_{kind}_{name}",
        "W": W, "H": H, "math": math, "rng": random.Random,
        # injected helpers (available to every library module)
        "px": px, "draw_eyes": draw_eyes,
        "sky_gradient": sky_gradient, "draw_env_bg": draw_env_bg,
        "apply_accessories": apply_accessories,
        "load_object": load_object,
    }
    try:
        code = compile(src, f"<fcukproxy:{rel}>", "exec")
        exec(code, ns)
    except Exception:  # noqa: BLE001
        return None
    cache[name] = ns
    return ns


def load_scene(name: str):
    """Return the draw(d, frame, total, rng, props) callable for a scene."""
    ns = _load_module("scenes", name, _SCENE_CACHE)
    if ns is None:
        return None
    return ns.get("draw")


def load_object(name: str):
    """Return the draw(...) callable for a library object (may be None)."""
    ns = _load_module("objects", name, _OBJECT_CACHE)
    if ns is None:
        return None
    return ns.get("draw")


# ─── drawing helpers (bundled, stable core) ────────────────────
def px(d, points, fill=None, outline=None, width=1):
    d.polygon(points, fill=fill, outline=outline)


def draw_eyes(d, cx, cy, scale, blink=0.0):
    for dx in (-10, 10):
        x = cx + dx * scale
        if blink < 0.5:
            d.ellipse((x - 4 * scale, cy - 5 * scale, x + 4 * scale, cy + 5 * scale), fill="#1a1a2e")
            d.ellipse((x - 1.5 * scale, cy - 2 * scale, x + 1.5 * scale, cy + 2 * scale), fill="#fff")
        else:
            d.line((x - 4 * scale, cy, x + 4 * scale, cy), fill="#1a1a2e", width=int(2 * scale))


def sky_gradient(d, top, bottom):
    for y in range(H):
        t = y / H
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        d.line((0, y, W, y), fill=(r, g, b))


def draw_env_bg(d, frame, rng, env):
    """Draw an environment background for a character scene."""
    if env == "snow":
        sky_gradient(d, (160, 190, 220), (230, 238, 250))
        for _ in range(70):
            sx = (rng.randrange(W) + frame * 0.6) % W
            sy = rng.randrange(H)
            d.ellipse((sx, sy, sx + 3, sy + 3), fill=(255, 255, 255))
        d.ellipse((0, H - 60, W, H), fill="#eef4fb")
    elif env == "city":
        sky_gradient(d, (24, 26, 42), (10, 10, 20))
        for _ in range(60):
            x, y = rng.randrange(W), rng.randrange(H)
            d.ellipse((x, y, x + 1, y + 1), fill=(255, 255, 255))
        for i in range(10):
            bx = i * (W // 10)
            bh = 40 + (i * 7) % 80
            d.rectangle((bx + 2, H - 70 - bh, bx + W // 10 - 2, H - 70), fill="#1a1a2e")
            win = (255, 220, 120) if (i + frame // 10) % 3 else (80, 120, 200)
            d.rectangle((bx + W // 20, H - 50 - bh // 2, bx + W // 20 + 6, H - 50 - bh // 2 + 6), fill=win)
        d.rectangle((0, H - 70, W, H), fill="#232526")
    elif env == "nature":
        sky_gradient(d, (135, 206, 235), (200, 235, 160))
        d.ellipse((W * 0.85, H * 0.15, W * 0.85 + 26, H * 0.15 + 26), fill="#ffd93d")
        for i in range(3):
            cyy = H - 60 - i * 25
            for j in range(5):
                cx = (i * 120 + j * 60 + 20) % W
                d.polygon([(cx, cyy), (cx + 18, cyy - 34), (cx + 36, cyy)], fill="#2a7d32")
        d.ellipse((0, H - 55, W, H), fill="#3e7d3e")
    elif env == "space":
        sky_gradient(d, (8, 8, 24), (30, 8, 50))
        for _ in range(60):
            x, y = rng.randrange(W), rng.randrange(H)
            tw = 0.3 + 0.7 * abs(math.sin(frame * 0.05 + x))
            d.ellipse((x, y, x + 2, y + 2), fill=(int(255 * tw), int(255 * tw), int(255 * tw)))
        d.ellipse((W * 0.78, H * 0.2, W * 0.78 + 30, H * 0.2 + 30), fill="#c850c0")
        d.ellipse((W * 0.2, H * 0.7, W * 0.2 + 18, H * 0.7 + 18), fill="#f4a261")
    elif env == "fire":
        sky_gradient(d, (30, 6, 6), (90, 20, 8))
        for i in range(20):
            fx = W * 0.5 + math.sin(frame * 0.1 + i * 0.5) * (60 + i * 3)
            fy = H - 30 - i * 3
            fh = 15 + i * 3
            d.ellipse((fx - 6, fy - fh, fx + 6, fy), fill="#e63946" if i % 2 else "#f4a261")
        d.rectangle((0, H - 20, W, H), fill="#2b0a0a")


def apply_accessories(d, scene, cx, cy, scale, props):
    """Apply requested accessories via library objects (lazy-loaded)."""
    if props.get("hat"):
        fn = load_object("hat")
        if fn:
            fn(d, cx, cy - int(30 * scale), scale)
    if props.get("crown"):
        fn = load_object("crown")
        if fn:
            fn(d, cx, cy - int(40 * scale), scale)
    if props.get("glasses"):
        fn = load_object("glasses")
        if fn:
            fn(d, cx, cy - int(5 * scale), scale)
    if props.get("bowtie"):
        fn = load_object("bowtie")
        if fn:
            fn(d, cx, cy + int(20 * scale), scale)
    if props.get("scarf"):
        fn = load_object("scarf")
        if fn:
            fn(d, cx, cy + int(8 * scale), scale)


# ─── classification ────────────────────────────────────────────
def classify(prompt: str):
    """Return (scene, props, duration)."""
    p = prompt.lower()
    duration = 3
    m = re.search(r"(\d+)\s*(?:sec|second)", p)
    if m:
        duration = max(1, min(10, int(m.group(1))))
    elif "3 second" in p or "three second" in p:
        duration = 3

    props = {"palette": []}

    if any(k in p for k in ["cat", "kitten", "kitty", "feline"]):
        scene = "cat"
    elif any(k in p for k in ["fox", "vulpes"]):
        scene = "fox"
    elif any(k in p for k in ["dog", "puppy", "hound"]):
        scene = "dog"
    elif any(k in p for k in ["bird", "robin", "eagle", "parrot", "owl"]):
        scene = "bird"
    elif any(k in p for k in ["robot", "android", "mech"]):
        scene = "robot"
    elif any(k in p for k in ["rocket", "space", "galaxy", "planet", "star", "astro", "ufo"]):
        scene = "space"
    elif any(k in p for k in ["fire", "flame", "campfire", "burn"]):
        scene = "fire"
    elif any(k in p for k in ["snow", "winter", "snowman", "ice"]):
        scene = "snow"
    elif any(k in p for k in ["city", "skyline", "neon", "urban", "building"]):
        scene = "city"
    else:
        scene = "nature"

    if "hat" in p:
        props["hat"] = True
    if "glasses" in p or "sunglasses" in p:
        props["glasses"] = True
    if "crown" in p:
        props["crown"] = True
    if "bowtie" in p:
        props["bowtie"] = True
    if "scarf" in p:
        props["scarf"] = True

    if any(k in p for k in ["snow", "winter", "snowman", "ice"]):
        props["env"] = "snow"
    elif any(k in p for k in ["city", "skyline", "neon", "urban", "building", "street"]):
        props["env"] = "city"
    elif any(k in p for k in ["beach", "forest", "field", "park", "ocean", "sea", "mountain", "grass"]):
        props["env"] = "nature"
    elif any(k in p for k in ["space", "galaxy", "planet", "star", "rocket", "nebula"]):
        props["env"] = "space"
    elif any(k in p for k in ["fire", "flame", "campfire", "burn"]):
        props["env"] = "fire"
    if "red" in p:
        props["palette"].append("#e63946")
    if "blue" in p:
        props["palette"].append("#457b9d")
    if "green" in p:
        props["palette"].append("#2a9d8f")
    if "gold" in p or "yellow" in p:
        props["palette"].append("#f4a261")

    return scene, props, duration


# ─── render ────────────────────────────────────────────────────
def _fallback_scene(d, frame, total, rng, props):
    """Minimal bundled scene used only when the library is unreachable."""
    sky_gradient(d, (135, 206, 235), (240, 180, 120))
    d.ellipse((90, 40, 134, 84), fill="#ffd93d")
    d.rectangle((0, H - 60, W, H), fill="#3e7d3e")


def render(scene, props, duration, outpath):
    os.makedirs(OUTDIR, exist_ok=True)
    total = max(1, int(duration * FPS))
    rng = random.Random(42)
    draw = load_scene(scene) or _fallback_scene
    from PIL import Image, ImageDraw
    frames = []
    for f in range(total):
        im = Image.new("RGB", (W, H))
        d = ImageDraw.Draw(im)
        draw(d, f, total, rng, props)
        frames.append(im)
    proc = subprocess.run(
        [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "ultrafast",
         "-pix_fmt", "yuv420p", outpath],
        input=b"".join(im.tobytes() for im in frames),
        capture_output=True,
    )
    if proc.returncode != 0:
        raise RuntimeError("ffmpeg: " + proc.stderr.decode()[-500:])
    return outpath


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--update":
        res = update_library()
        print(json.dumps(res))
        sys.exit(0)
    prompt = args[0] if args else "a cat in a hat"
    scene, props, duration = classify(prompt)
    out = args[1] if len(args) > 1 else os.path.join(OUTDIR, "test.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    render(scene, props, duration, out)
    print(f"{scene} {duration}s -> {out} (library v{get_manifest().get('library_version')})")
