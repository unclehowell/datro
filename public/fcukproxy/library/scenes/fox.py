"""fcukproxy library scene: fox (v0.2.0)"""
META = {"name": "fox", "keywords": ["fox", "vulpes"]}


def draw(d, frame, total, rng, props):
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
    tx = cx + 62 + math.sin(frame / 3.0) * 6
    for i in range(22):
        ty = cy + 46 - i * 2
        tt = cx + 58 + i * 1.4
        d.ellipse((tt - 3, ty - 3, tt + 3, ty + 3), fill=body)
    d.ellipse((tx + 12, cy + 10, tx + 30, cy + 28), fill=cream)
    d.ellipse((cx - 42, cy + 8, cx + 42, cy + 76), fill=body)
    d.ellipse((cx - 30, cy + 30, cx - 14, cy + 76), fill=cream)
    hx, hy = cx + sway, cy + bob
    d.ellipse((hx - 36, hy - 8, hx + 36, hy + 42), fill=body)
    px(d, [(hx - 32, hy), (hx - 18, hy - 36), (hx - 4, hy - 2)], fill=body)
    px(d, [(hx + 4, hy - 2), (hx + 18, hy - 36), (hx + 32, hy)], fill=body)
    px(d, [(hx - 28, hy - 2), (hx - 18, hy - 30), (hx - 9, hy - 3)], fill="#3a2b24")
    px(d, [(hx + 9, hy - 3), (hx + 18, hy - 30), (hx + 28, hy - 2)], fill="#3a2b24")
    d.ellipse((hx - 18, hy + 14, hx + 18, hy + 38), fill=cream)
    draw_eyes(d, hx, hy + 12, 1, 0.0)
    px(d, [(hx - 5, hy + 26), (hx + 5, hy + 26), (hx, hy + 32)], fill="#2a1a14")
    d.line((hx, hy + 32, hx, hy + 36), fill="#2a1a14", width=1)
    d.line((hx, hy + 36, hx - 8, hy + 42), fill="#2a1a14", width=1)
    d.line((hx, hy + 36, hx + 8, hy + 42), fill="#2a1a14", width=1)
    for dy in (0, 2, 4):
        d.line((hx - 36, hy + 22 + dy, hx - 12, hy + 26), fill="#2a1a14", width=1)
        d.line((hx + 36, hy + 22 + dy, hx + 12, hy + 26), fill="#2a1a14", width=1)
    apply_accessories(d, "fox", hx, hy + 18, 1, props)
