"""fcukproxy library scene: robot (v0.2.0)"""
META = {"name": "robot", "keywords": ["robot", "android", "mech"]}


def draw(d, frame, total, rng, props):
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
    d.rectangle((cx - 26, cy + 56, cx - 10, cy + 80), fill=body)
    d.rectangle((cx + 10, cy + 56, cx + 26, cy + 80), fill=body)
    d.rounded_rectangle((cx - 42, cy + 6, cx + 42, cy + 66), 10, fill=body, outline="#5c677d", width=3)
    for yy in range(cy + 22, cy + 56, 10):
        for xx in range(cx - 24, cx + 24, 14):
            d.rectangle((xx, yy, xx + 8, yy + 6), fill="#edf2f4")
    arm_a = math.sin(frame / 5.0) * 10
    d.line((cx - 42, cy + 16, cx - 62, cy + 40 + arm_a), fill=body, width=6)
    d.line((cx + 42, cy + 16, cx + 62, cy + 40 - arm_a), fill=body, width=6)
    d.ellipse((cx - 68, cy + 34 + arm_a, cx - 56, cy + 46 + arm_a), fill=body)
    d.ellipse((cx + 56, cy + 34 - arm_a, cx + 68, cy + 46 - arm_a), fill=body)
    hx, hy = cx, cy - 8 + bob
    d.rounded_rectangle((hx - 36, hy - 52, hx + 36, hy - 2), 10, fill=body, outline="#5c677d", width=3)
    d.line((hx, hy - 52, hx, hy - 68), fill="#5c677d", width=3)
    light = (255, 80, 80) if frame % 30 < 15 else (80, 255, 120)
    d.ellipse((hx - 5, hy - 74, hx + 5, hy - 64), fill=light)
    for dx in (-14, 14):
        d.ellipse((hx + dx - 8, hy - 36, hx + dx + 8, hy - 22), fill="#1a1a2e")
        d.ellipse((hx + dx - 3, hy - 32, hx + dx + 3, hy - 26), fill="#4dff88")
    for i in range(4):
        d.line((hx - 20 + i * 12, hy - 12, hx - 12 + i * 12, hy - 12), fill="#edf2f4", width=3)
    apply_accessories(d, "robot", hx, hy, 1, props)
