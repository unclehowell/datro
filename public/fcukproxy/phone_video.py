#!/usr/bin/env python3
"""fcukproxy video engine — procedural scene renderer for child proxies.

Classifies a prompt into a scene + props, renders animated frames with
Pillow, encodes to MP4 with ffmpeg. No Chromium/Remotion needed — runs on
any minimal-compute child-proxy device (laptop, Raspberry Pi, Termux/Android).

Scenes: cat, fox, dog, bird, robot, space, fire, snow, city, nature.
"""
import io
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile

W, H, FPS = 480, 270, 24
# Library version — bump with each scene/object addition so the branch
# rerelease mechanism can report which version each child proxy runs.
LIB_VERSION = "0.1.0"
# Prefer ffmpeg on PATH; fall back to the Termux location (not on PATH under run-as).
FFMPEG = (
    shutil.which("ffmpeg")
    or "/data/data/com.termux/files/usr/bin/ffmpeg"
    or "ffmpeg"
)
OUTDIR = os.path.join(os.path.expanduser("~"), ".fcukproxy", "videos")

ACCESSORIES = ["hat", "glasses", "crown", "bowtie", "scarf", "sunglasses"]


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


# ─── drawing helpers ───────────────────────────────────────────
def px(d, points, fill=None, outline=None, width=1):
    d.polygon(points, fill=fill, outline=outline)


def draw_top_hat(d, cx, cy, scale, color="#1a1a2e"):
    brim_w, brim_h = int(70 * scale), int(8 * scale)
    crown_w, crown_h = int(44 * scale), int(46 * scale)
    d.rectangle((cx - brim_w // 2, cy - 6 * scale, cx + brim_w // 2, cy + brim_w // 2 * 0 + brim_h), fill=color)
    d.rectangle((cx - crown_w // 2, cy - 46 * scale, cx + crown_w // 2, cy), fill=color)
    d.rectangle((cx - crown_w // 2 - 3 * scale, cy - 46 * scale, cx + crown_w // 2 + 3 * scale, cy - 44 * scale),
                fill="#f4a261")


def draw_crown(d, cx, cy, scale, color="#ffd93d"):
    w = int(52 * scale)
    h = int(26 * scale)
    px(d, [(cx - w // 2, cy), (cx - w // 2, cy - h // 2), (cx - w // 6, cy - h // 3),
           (cx, cy - h), (cx + w // 6, cy - h // 3), (cx + w // 2, cy - h // 2), (cx + w // 2, cy)], fill=color)
    for i in range(-2, 3):
        d.rectangle((cx + i * 9 * scale - 1 * scale, cy - 2 * scale, cx + i * 9 * scale + 1 * scale, cy), fill="#e63946")


def draw_glasses(d, cx, cy, scale):
    r = int(14 * scale)
    for dx in (-16, 16):
        d.ellipse((cx + dx * scale - r, cy - r, cx + dx * scale + r, cy + r), outline="#222", width=int(2 * scale))
    d.line((cx - 16 * scale + r, cy, cx + 16 * scale - r, cy), fill="#222", width=int(2 * scale))


def draw_eyes(d, cx, cy, scale, blink=0.0):
    for dx in (-10, 10):
        x = cx + dx * scale
        if blink < 0.5:
            d.ellipse((x - 4 * scale, cy - 5 * scale, x + 4 * scale, cy + 5 * scale), fill="#1a1a2e")
            d.ellipse((x - 1.5 * scale, cy - 2 * scale, x + 1.5 * scale, cy + 2 * scale), fill="#fff")
        else:
            d.line((x - 4 * scale, cy, x + 4 * scale, cy), fill="#1a1a2e", width=int(2 * scale))


def draw_scarf(d, cx, cy, scale, color="#e63946"):
    d.rectangle((cx - 18 * scale, cy + 4 * scale, cx + 18 * scale, cy + 12 * scale), fill=color)
    d.polygon([(cx + 14 * scale, cy + 8 * scale), (cx + 30 * scale, cy + 22 * scale),
               (cx + 24 * scale, cy + 26 * scale), (cx + 10 * scale, cy + 14 * scale)], fill=color)


def draw_bowtie(d, cx, cy, scale):
    s = int(12 * scale)
    px(d, [(cx - s, cy), (cx, cy - s), (cx + s, cy), (cx, cy + s)], fill="#e63946")


def apply_accessories(d, scene, cx, cy, scale, props):
    if props.get("hat"):
        draw_top_hat(d, cx, cy - int(30 * scale), scale)
    if props.get("crown"):
        draw_crown(d, cx, cy - int(40 * scale), scale)
    if props.get("glasses"):
        draw_glasses(d, cx, cy - int(5 * scale), scale)
    if props.get("bowtie"):
        draw_bowtie(d, cx, cy + int(20 * scale), scale)
    if props.get("scarf"):
        draw_scarf(d, cx, cy + int(8 * scale), scale)


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


# ─── scenes ────────────────────────────────────────────────────
def scene_cat(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (40, 44, 72), (18, 18, 34))
        for _ in range(60):
            x, y = rng.randrange(W), rng.randrange(H)
            d.ellipse((x, y, x + 1, y + 1), fill=(255, 255, 255, 120) if hasattr(d, "ellipse") else (255, 255, 255))
    cx, cy = W // 2, H // 2 + 30
    sway = math.sin(frame / 4.0) * 6
    bob = math.sin(frame / 10.0) * 4
    blink = 1.0 if (frame % 48) in (30, 31) else 0.0
    body = "#f4a261" if not props["palette"] else props["palette"][0]
    # tail
    tail_x = cx + 60
    for i in range(20):
        ty = cy + 40 - i * 2 + math.sin(frame / 3 + i / 3) * 3
        tx = cx + 55 + i * 1.2 + sway
        d.ellipse((tx - 3, ty - 3, tx + 3, ty + 3), fill=body)
    # body
    d.ellipse((cx - 45, cy + 10, cx + 45, cy + 80), fill=body)
    d.ellipse((cx - 38, cy + 28, cx - 20, cy + 80), fill="#e07a3f")
    d.ellipse((cx + 20, cy + 28, cx + 38, cy + 80), fill="#e07a3f")
    # head
    hx, hy = cx + sway, cy + bob
    d.ellipse((hx - 38, hy - 10, hx + 38, hy + 46), fill=body)
    # ears
    px(d, [(hx - 34, hy - 2), (hx - 20, hy - 34), (hx - 6, hy - 4)], fill=body)
    px(d, [(hx + 6, hy - 4), (hx + 20, hy - 34), (hx + 34, hy - 2)], fill=body)
    px(d, [(hx - 30, hy - 4), (hx - 21, hy - 26), (hx - 12, hy - 5)], fill="#ffb3b3")
    px(d, [(hx + 12, hy - 5), (hx + 21, hy - 26), (hx + 30, hy - 4)], fill="#ffb3b3")
    # eyes
    draw_eyes(d, hx, hy + 12, 1, blink)
    # nose + mouth + whiskers
    px(d, [(hx - 5, hy + 24), (hx + 5, hy + 24), (hx, hy + 30)], fill="#e63946")
    d.arc((hx - 12, hy + 26, hx, hy + 38), 200, 340, fill="#1a1a2e", width=1)
    d.arc((hx, hy + 26, hx + 12, hy + 38), 20, 160, fill="#1a1a2e", width=1)
    for dy in (0, 2, 4):
        d.line((hx - 38, hy + 20 + dy, hx - 14, hy + 24), fill="#1a1a2e", width=1)
        d.line((hx + 38, hy + 20 + dy, hx + 14, hy + 24), fill="#1a1a2e", width=1)
    apply_accessories(d, "cat", hx, hy + 18, 1, props)


def scene_fox(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (135, 206, 235), (200, 235, 160))
        for i in range(3):
            cyy = H - 60 - i * 25
            for j in range(5):
                cx = (i * 120 + j * 60 + 20) % W
                d.polygon([(cx, cyy), (cx + 18, cyy - 34), (cx + 36, cyy)], fill="#2a7d32")
        d.ellipse((0, H - 55, W, H), fill="#3e7d3e")
    cx, cy = W // 2, H // 2 + 34
    sway = math.sin(frame / 4.0) * 6
    bob = math.sin(frame / 10.0) * 4
    body = "#e76f51" if not props["palette"] else props["palette"][0]
    cream = "#f8ede3"
    # bushy tail (white tip) — behind body
    tx = cx + 62 + math.sin(frame / 3.0) * 6
    for i in range(22):
        ty = cy + 46 - i * 2
        tt = cx + 58 + i * 1.4
        d.ellipse((tt - 3, ty - 3, tt + 3, ty + 3), fill=body)
    d.ellipse((tx + 12, cy + 10, tx + 30, cy + 28), fill=cream)
    # body
    d.ellipse((cx - 42, cy + 8, cx + 42, cy + 76), fill=body)
    d.ellipse((cx - 30, cy + 30, cx - 14, cy + 76), fill=cream)
    # head
    hx, hy = cx + sway, cy + bob
    d.ellipse((hx - 36, hy - 8, hx + 36, hy + 42), fill=body)
    # pointy ears with dark tips
    px(d, [(hx - 32, hy), (hx - 18, hy - 36), (hx - 4, hy - 2)], fill=body)
    px(d, [(hx + 4, hy - 2), (hx + 18, hy - 36), (hx + 32, hy)], fill=body)
    px(d, [(hx - 28, hy - 2), (hx - 18, hy - 30), (hx - 9, hy - 3)], fill="#3a2b24")
    px(d, [(hx + 9, hy - 3), (hx + 18, hy - 30), (hx + 28, hy - 2)], fill="#3a2b24")
    # white muzzle
    d.ellipse((hx - 18, hy + 14, hx + 18, hy + 38), fill=cream)
    # eyes
    draw_eyes(d, hx, hy + 12, 1, 0.0)
    # nose + mouth + whiskers
    px(d, [(hx - 5, hy + 26), (hx + 5, hy + 26), (hx, hy + 32)], fill="#2a1a14")
    d.line((hx, hy + 32, hx, hy + 36), fill="#2a1a14", width=1)
    d.line((hx, hy + 36, hx - 8, hy + 42), fill="#2a1a14", width=1)
    d.line((hx, hy + 36, hx + 8, hy + 42), fill="#2a1a14", width=1)
    for dy in (0, 2, 4):
        d.line((hx - 36, hy + 22 + dy, hx - 12, hy + 26), fill="#2a1a14", width=1)
        d.line((hx + 36, hy + 22 + dy, hx + 12, hy + 26), fill="#2a1a14", width=1)
    apply_accessories(d, "fox", hx, hy + 18, 1, props)


def scene_dog(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (52, 78, 65), (24, 36, 30))
        d.ellipse((0, H - 8, W, H), fill="#2e4a34")
    cx, cy = W // 2, H // 2 + 40
    bob = math.sin(frame / 8.0) * 4
    wag = math.sin(frame / 2.0) * 6
    body = "#b5651d" if not props["palette"] else props["palette"][0]
    # tail
    for i in range(15):
        tx = cx + 50 + i * 1.4
        ty = cy + 10 - i * 2 + wag * (i / 15)
        d.ellipse((tx - 4, ty - 4, tx + 4, ty + 4), fill=body)
    # body
    d.ellipse((cx - 50, cy, cx + 50, cy + 60), fill=body)
    d.ellipse((cx - 30, cy - 5, cx + 10, cy + 40), fill="#d4a373")
    # head
    hx, hy = cx + bob, cy - 20
    d.ellipse((hx - 34, hy - 30, hx + 34, hy + 30), fill=body)
    # floppy ears
    d.ellipse((hx - 36, hy - 18, hx - 12, hy + 26), fill="#8b4513")
    d.ellipse((hx + 12, hy - 18, hx + 36, hy + 26), fill="#8b4513")
    # snout
    d.ellipse((hx - 20, hy + 6, hx + 20, hy + 28), fill="#d4a373")
    d.ellipse((hx - 6, hy + 8, hx + 6, hy + 18), fill="#1a1a2e")
    # eyes
    draw_eyes(d, hx, hy, 1, 1.0 if (frame % 40) in (24, 25) else 0.0)
    d.arc((hx - 10, hy + 18, hx + 10, hy + 28), 0, 180, fill="#1a1a2e", width=1)
    apply_accessories(d, "dog", hx, hy, 1, props)


def scene_bird(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (137, 196, 244), (94, 132, 226))
        d.ellipse((0, 0, W, H), fill=None)
    cx, cy = W // 2, H // 2 - 20
    flap = math.sin(frame / 4.0)
    bob = math.sin(frame / 6.0) * 6
    body = "#457b9d" if not props["palette"] else props["palette"][0]
    belly = "#e9c46a"
    # tail
    px(d, [(cx - 30, cy + 14), (cx - 60, cy + 6 + flap * 8), (cx - 52, cy + 26)], fill=body)
    # body
    d.ellipse((cx - 30, cy - 18 + bob, cx + 30, cy + 26 + bob), fill=body)
    d.ellipse((cx - 10, cy + 4 + bob, cx + 28, cy + 24 + bob), fill=belly)
    # wing
    px(d, [(cx - 2, cy - 6 + bob), (cx - 26, cy - 2 + bob - flap * 18), (cx - 24, cy + 14 + bob)], fill="#2a5f8f")
    # head
    hx = cx + 26
    d.ellipse((hx - 14, cy - 22 + bob, hx + 20, cy + 4 + bob), fill=body)
    # beak
    px(d, [(hx + 18, cy - 6 + bob), (hx + 40, cy - 2 + bob), (hx + 18, cy + 2 + bob)], fill="#e76f51")
    # eye
    d.ellipse((hx + 4, cy - 10 + bob, hx + 10, cy - 4 + bob), fill="#1a1a2e")
    d.ellipse((hx + 6, cy - 9 + bob, hx + 8, cy - 7 + bob), fill="#fff")
    # legs
    d.line((cx - 8, cy + 26 + bob, cx - 10, cy + 44 + bob), fill="#f4a261", width=2)
    d.line((cx + 6, cy + 26 + bob, cx + 4, cy + 44 + bob), fill="#f4a261", width=2)
    d.line((cx - 16, cy + 44 + bob, cx - 4, cy + 44 + bob), fill="#f4a261", width=2)
    d.line((cx + -2, cy + 44 + bob, cx + 10, cy + 44 + bob), fill="#f4a261", width=2)
    # clouds
    for i, (ccx, ccy) in enumerate([(80, 50), (360, 80)]):
        d.ellipse((ccx - 20, ccy, ccx + 20, ccy + 12), fill="rgba(255,255,255,220)" if False else (255, 255, 255))
        d.ellipse((ccx - 30, ccy - 8, ccx + 30, ccy + 8), fill=(255, 255, 255))
    apply_accessories(d, "bird", hx, cy - 6 + bob, 1, props)


def scene_robot(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (24, 26, 42), (10, 10, 20))
        for _ in range(50):
            x, y = rng.randrange(W), rng.randrange(H)
            d.ellipse((x, y, x + 1, y + 1), fill=(255, 255, 255))
    cx, cy = W // 2, H // 2 + 20
    bob = math.sin(frame / 6.0) * 3
    body = "#8d99ae" if not props["palette"] else props["palette"][0]
    # legs
    d.rectangle((cx - 26, cy + 56, cx - 10, cy + 80), fill=body)
    d.rectangle((cx + 10, cy + 56, cx + 26, cy + 80), fill=body)
    # body
    d.rounded_rectangle((cx - 42, cy + 6, cx + 42, cy + 66), 10, fill=body, outline="#5c677d", width=3)
    for yy in range(cy + 22, cy + 56, 10):
        for xx in range(cx - 24, cx + 24, 14):
            d.rectangle((xx, yy, xx + 8, yy + 6), fill="#edf2f4")
    # arms
    arm_a = math.sin(frame / 5.0) * 10
    d.line((cx - 42, cy + 16, cx - 62, cy + 40 + arm_a), fill=body, width=6)
    d.line((cx + 42, cy + 16, cx + 62, cy + 40 - arm_a), fill=body, width=6)
    d.ellipse((cx - 68, cy + 34 + arm_a, cx - 56, cy + 46 + arm_a), fill=body)
    d.ellipse((cx + 56, cy + 34 - arm_a, cx + 68, cy + 46 - arm_a), fill=body)
    # head
    hx, hy = cx, cy - 8 + bob
    d.rounded_rectangle((hx - 36, hy - 52, hx + 36, hy - 2), 10, fill=body, outline="#5c677d", width=3)
    # antenna
    d.line((hx, hy - 52, hx, hy - 68), fill="#5c677d", width=3)
    light = (255, 80, 80) if frame % 30 < 15 else (80, 255, 120)
    d.ellipse((hx - 5, hy - 74, hx + 5, hy - 64), fill=light)
    # eyes
    for dx in (-14, 14):
        d.ellipse((hx + dx - 8, hy - 36, hx + dx + 8, hy - 22), fill="#1a1a2e")
        d.ellipse((hx + dx - 3, hy - 32, hx + dx + 3, hy - 26), fill="#4dff88")
    # mouth
    for i in range(4):
        d.line((hx - 20 + i * 12, hy - 12, hx - 12 + i * 12, hy - 12), fill="#edf2f4", width=3)
    apply_accessories(d, "robot", hx, hy, 1, props)


def scene_space(d, frame, total, rng, props):
    sky_gradient(d, (8, 8, 30), (28, 12, 58))
    for _ in range(120):
        x, y = rng.randrange(W), rng.randrange(H)
        tw = 1 + (rng.random() > 0.7)
        d.ellipse((x, y, x + tw, y + tw), fill=(255, 255, 255))
    # planet
    plx, ply = W - 90, 70
    d.ellipse((plx - 26, ply - 26, plx + 26, ply + 26), fill="#c850c0")
    d.ellipse((plx - 26, ply - 26, plx + 26, ply + 26), outline="#f1faee", width=2)
    d.ellipse((plx - 40, ply - 6, plx + 40, ply + 6), outline="#f1faee", width=3)
    # rocket
    rx, ry = W // 2 - 40, H - 80 - frame * 2
    tilt = math.sin(frame / 5.0) * 3
    d.polygon([(rx, ry - 60), (rx - 18, ry - 8), (rx - 18, ry + 40), (rx + 18, ry + 40), (rx + 18, ry - 8)],
              fill="#edf2f4")
    d.polygon([(rx, ry - 60), (rx - 12, ry - 30), (rx + 12, ry - 30)], fill="#e63946")
    d.ellipse((rx - 10, ry + 4, rx + 10, ry + 24), fill="#4d96ff")
    for s in (-1, 1):
        d.polygon([(rx + s * 18, ry + 16), (rx + s * 34, ry + 30), (rx + s * 18, ry + 34)], fill="#e63946")
    fl = 14 + (frame % 6)
    px(d, [(rx - 10, ry + 40), (rx, ry + 40 + fl), (rx + 10, ry + 40)], fill="#f9d423")


def scene_fire(d, frame, total, rng, props):
    sky_gradient(d, (30, 12, 12), (10, 6, 10))
    cx = W // 2
    # logs
    d.rectangle((cx - 70, H - 40, cx + 70, H - 30), fill="#6b3a2a")
    d.rectangle((cx - 70, H - 34, cx + 70, H - 24), fill="#5a2e20")
    for f in range(3):
        flick = (frame + f * 11) % 24
        hgt = 60 + flick * 2.2 + f * 12
        wid = 34 - f * 5
        fx = cx + (f - 1) * 26
        grad = ["#f9d423", "#f83600", "#ff4e50"]
        for layer in range(4):
            ll = hgt * (1 - layer * 0.22)
            lw = wid * (1 - layer * 0.18)
            col = grad[layer % len(grad)]
            px(d, [(fx, H - 34), (fx - lw, H - 34 - ll), (fx + lw, H - 34 - ll)], fill=col)
    # embers
    for _ in range(14):
        ex = cx + rng.uniform(-80, 80)
        ey = H - 40 - ((frame * 2 + rng.random() * 30) % 120)
        d.ellipse((ex, ey, ex + 3, ey + 3), fill="#ffd93d")


def scene_snow(d, frame, total, rng, props):
    sky_gradient(d, (160, 190, 220), (230, 238, 250))
    for _ in range(70):
        sx = (rng.randrange(W) + frame * 0.6) % W
        sy = rng.randrange(H)
        d.ellipse((sx, sy, sx + 3, sy + 3), fill=(255, 255, 255))
    # ground
    d.ellipse((0, H - 60, W, H), fill="#eef4fb")
    # snowman
    cx, cy = W // 2, H - 30
    d.ellipse((cx - 38, cy - 70, cx + 38, cy), fill="#ffffff")
    d.ellipse((cx - 28, cy - 116, cx + 28, cy - 66), fill="#ffffff")
    d.ellipse((cx - 20, cy - 150, cx + 20, cy - 112), fill="#ffffff")
    d.ellipse((cx - 10, cy - 138, cx - 4, cy - 132), fill="#1a1a2e")
    d.ellipse((cx + 4, cy - 138, cx + 10, cy - 132), fill="#1a1a2e")
    px(d, [(cx, cy - 126), (cx + 4, cy - 122), (cx - 4, cy - 122)], fill="#e76f51")
    d.arc((cx - 12, cy - 122, cx + 12, cy - 112), 0, 180, fill="#1a1a2e", width=2)
    # scarf + hat
    d.rectangle((cx - 16, cy - 112, cx + 16, cy - 104), fill="#e63946")
    d.rectangle((cx - 26, cy - 152, cx + 26, cy - 140), fill="#1a1a2e")
    d.rectangle((cx - 30, cy - 140, cx + 30, cy - 136), fill="#1a1a2e")
    # arms
    arm_a = math.sin(frame / 6.0) * 6
    d.line((cx - 38, cy - 90, cx - 66, cy - 70 + arm_a), fill="#6b3a2a", width=3)
    d.line((cx + 38, cy - 90, cx + 66, cy - 70 - arm_a), fill="#6b3a2a", width=3)


def scene_city(d, frame, total, rng, props):
    sky_gradient(d, (20, 16, 44), (40, 24, 60))
    moon = W - 60
    d.ellipse((moon - 16, 46, moon + 16, 78), fill="#f1faee")
    buildings = []
    x = -20
    while x < W:
        bw = rng.randrange(50, 90)
        bh = rng.randrange(80, 200)
        buildings.append((x, bh))
        x += bw + 6
    for bx, bh in buildings:
        d.rectangle((bx, H - bh, bx + 60, H), fill=rng.choice(["#232526", "#2b2d31", "#3a3d42"]))
        for wy in range(H - bh + 12, H - 10, 22):
            for wx in range(bx + 8, bx + 52, 16):
                lit = rng.random() > 0.5
                if lit:
                    d.rectangle((wx, wy, wx + 6, wy + 8), fill=rng.choice(["#ffd93d", "#ff9f43", "#f8f9fa"]))
    # car lights
    for _ in range(3):
        cy = H - 24 - (frame * 2 + _ * 40) % 40
        d.ellipse((0, cy, 12, cy + 6), fill="#ff6b6b")
        d.ellipse((W - 12, cy, W, cy + 6), fill="#4d96ff")


def scene_nature(d, frame, total, rng, props):
    sky_gradient(d, (135, 206, 235), (240, 180, 120))
    sun_x = 90 + math.sin(frame / 30.0) * 2
    d.ellipse((sun_x - 22, 40, sun_x + 22, 84), fill="#ffd93d")
    for i in range(3):
        mx = 60 + i * 140
        mh = 90 - i * 18
        px(d, [(mx - 80, H - 60), (mx, H - 60 - mh), (mx + 80, H - 60)], fill="#5b8c5a")
        px(d, [(mx - 80, H - 60), (mx, H - 60 - mh), (mx + 80, H - 60)], outline="#3d6b3d", width=1)
    d.rectangle((0, H - 60, W, H), fill="#3e7d3e")
    d.ellipse((0, H - 60, W, H), fill="#2e6b2e")
    # tree
    tx = W - 90
    d.rectangle((tx - 8, H - 120, tx + 8, H - 60), fill="#6b3a2a")
    for i in range(4):
        sway = math.sin(frame / 10.0 + i) * 3
        ry = H - 150 - i * 26
        rr = 34 - i * 5
        d.ellipse((tx - rr + sway, ry - rr, tx + rr + sway, ry + rr), fill="#2a9d8f")
    # river
    for y in range(H - 60, H):
        t = (y - (H - 60)) / 60
        d.line((0, y, W, y), fill=(int(70 + t * 40), int(140 + t * 60), int(190 + t * 30)))
    # boat on river
    bx = (frame * 2) % (W + 80) - 40
    d.polygon([(bx, H - 34), (bx + 40, H - 34), (bx + 32, H - 22), (bx + 8, H - 22)], fill="#8b5a2b")
    d.line((bx + 20, H - 34, bx + 20, H - 58), fill="#6b3a2a", width=2)
    d.polygon([(bx + 20, H - 58), (bx + 20, H - 40), (bx + 38, H - 48)], fill="#f1faee")


SCENES = {
    "cat": scene_cat,
    "fox": scene_fox,
    "dog": scene_dog,
    "bird": scene_bird,
    "robot": scene_robot,
    "space": scene_space,
    "fire": scene_fire,
    "snow": scene_snow,
    "city": scene_city,
    "nature": scene_nature,
}


# ─── render ────────────────────────────────────────────────────
def render(scene, props, duration, outpath):
    os.makedirs(OUTDIR, exist_ok=True)
    total = max(1, int(duration * FPS))
    rng = random.Random(42)
    frames = []
    from PIL import Image, ImageDraw
    for f in range(total):
        im = Image.new("RGB", (W, H))
        d = ImageDraw.Draw(im)
        fn = SCENES.get(scene, scene_nature)
        fn(d, f, total, rng, props)
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
    prompt = sys.argv[1] if len(sys.argv) > 1 else "a cat in a hat"
    scene, props, duration = classify(prompt)
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(OUTDIR, "test.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    render(scene, props, duration, out)
    print(f"{scene} {duration}s -> {out}")
