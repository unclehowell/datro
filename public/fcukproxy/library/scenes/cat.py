"""fcukproxy library scene: cat (v0.2.0)"""
META = {"name": "cat", "keywords": ["cat", "kitten", "kitty", "feline"]}


def draw(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (40, 44, 72), (18, 18, 34))
        for _ in range(60):
            x, y = rng.randrange(W), rng.randrange(H)
            d.ellipse((x, y, x + 1, y + 1), fill=(255, 255, 255))
    cx, cy = W // 2, H // 2 + 30
    sway = math.sin(frame / 4.0) * 6
    bob = math.sin(frame / 10.0) * 4
    blink = 1.0 if (frame % 48) in (30, 31) else 0.0
    body = "#f4a261" if not props["palette"] else props["palette"][0]
    for i in range(20):
        ty = cy + 40 - i * 2 + math.sin(frame / 3 + i / 3) * 3
        tx = cx + 55 + i * 1.2 + sway
        d.ellipse((tx - 3, ty - 3, tx + 3, ty + 3), fill=body)
    d.ellipse((cx - 45, cy + 10, cx + 45, cy + 80), fill=body)
    d.ellipse((cx - 38, cy + 28, cx - 20, cy + 80), fill="#e07a3f")
    d.ellipse((cx + 20, cy + 28, cx + 38, cy + 80), fill="#e07a3f")
    hx, hy = cx + sway, cy + bob
    d.ellipse((hx - 38, hy - 10, hx + 38, hy + 46), fill=body)
    px(d, [(hx - 34, hy - 2), (hx - 20, hy - 34), (hx - 6, hy - 4)], fill=body)
    px(d, [(hx + 6, hy - 4), (hx + 20, hy - 34), (hx + 34, hy - 2)], fill=body)
    px(d, [(hx - 30, hy - 4), (hx - 21, hy - 26), (hx - 12, hy - 5)], fill="#ffb3b3")
    px(d, [(hx + 12, hy - 5), (hx + 21, hy - 26), (hx + 30, hy - 4)], fill="#ffb3b3")
    draw_eyes(d, hx, hy + 12, 1, blink)
    px(d, [(hx - 5, hy + 24), (hx + 5, hy + 24), (hx, hy + 30)], fill="#e63946")
    d.arc((hx - 12, hy + 26, hx, hy + 38), 200, 340, fill="#1a1a2e", width=1)
    d.arc((hx, hy + 26, hx + 12, hy + 38), 20, 160, fill="#1a1a2e", width=1)
    for dy in (0, 2, 4):
        d.line((hx - 38, hy + 20 + dy, hx - 14, hy + 24), fill="#1a1a2e", width=1)
        d.line((hx + 38, hy + 20 + dy, hx + 14, hy + 24), fill="#1a1a2e", width=1)
    apply_accessories(d, "cat", hx, hy + 18, 1, props)
