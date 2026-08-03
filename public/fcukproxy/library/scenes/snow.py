"""fcukproxy library scene: snow (v0.2.0)"""
META = {"name": "snow", "keywords": ["snow", "winter", "snowman", "ice"]}


def draw(d, frame, total, rng, props):
    sky_gradient(d, (160, 190, 220), (230, 238, 250))
    for _ in range(70):
        sx = (rng.randrange(W) + frame * 0.6) % W
        sy = rng.randrange(H)
        d.ellipse((sx, sy, sx + 3, sy + 3), fill=(255, 255, 255))
    d.ellipse((0, H - 60, W, H), fill="#eef4fb")
    cx, cy = W // 2, H - 30
    d.ellipse((cx - 38, cy - 70, cx + 38, cy), fill="#ffffff")
    d.ellipse((cx - 28, cy - 116, cx + 28, cy - 66), fill="#ffffff")
    d.ellipse((cx - 20, cy - 150, cx + 20, cy - 112), fill="#ffffff")
    d.ellipse((cx - 10, cy - 138, cx - 4, cy - 132), fill="#1a1a2e")
    d.ellipse((cx + 4, cy - 138, cx + 10, cy - 132), fill="#1a1a2e")
    px(d, [(cx, cy - 126), (cx + 4, cy - 122), (cx - 4, cy - 122)], fill="#e76f51")
    d.arc((cx - 12, cy - 122, cx + 12, cy - 112), 0, 180, fill="#1a1a2e", width=2)
    d.rectangle((cx - 16, cy - 112, cx + 16, cy - 104), fill="#e63946")
    d.rectangle((cx - 26, cy - 152, cx + 26, cy - 140), fill="#1a1a2e")
    d.rectangle((cx - 30, cy - 140, cx + 30, cy - 136), fill="#1a1a2e")
    arm_a = math.sin(frame / 6.0) * 6
    d.line((cx - 38, cy - 90, cx - 66, cy - 70 + arm_a), fill="#6b3a2a", width=3)
    d.line((cx + 38, cy - 90, cx + 66, cy - 70 - arm_a), fill="#6b3a2a", width=3)
