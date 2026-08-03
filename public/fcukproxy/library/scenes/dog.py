"""fcukproxy library scene: dog (v0.2.0)"""
META = {"name": "dog", "keywords": ["dog", "puppy", "hound"]}


def draw(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (52, 78, 65), (24, 36, 30))
        d.ellipse((0, H - 8, W, H), fill="#2e4a34")
    cx, cy = W // 2, H // 2 + 40
    bob = math.sin(frame / 8.0) * 4
    wag = math.sin(frame / 2.0) * 6
    body = "#b5651d" if not props["palette"] else props["palette"][0]
    for i in range(15):
        tx = cx + 50 + i * 1.4
        ty = cy + 10 - i * 2 + wag * (i / 15)
        d.ellipse((tx - 4, ty - 4, tx + 4, ty + 4), fill=body)
    d.ellipse((cx - 50, cy, cx + 50, cy + 60), fill=body)
    d.ellipse((cx - 30, cy - 5, cx + 10, cy + 40), fill="#d4a373")
    hx, hy = cx + bob, cy - 20
    d.ellipse((hx - 34, hy - 30, hx + 34, hy + 30), fill=body)
    d.ellipse((hx - 36, hy - 18, hx - 12, hy + 26), fill="#8b4513")
    d.ellipse((hx + 12, hy - 18, hx + 36, hy + 26), fill="#8b4513")
    d.ellipse((hx - 20, hy + 6, hx + 20, hy + 28), fill="#d4a373")
    d.ellipse((hx - 6, hy + 8, hx + 6, hy + 18), fill="#1a1a2e")
    draw_eyes(d, hx, hy, 1, 1.0 if (frame % 40) in (24, 25) else 0.0)
    d.arc((hx - 10, hy + 18, hx + 10, hy + 28), 0, 180, fill="#1a1a2e", width=1)
    apply_accessories(d, "dog", hx, hy, 1, props)
