"""fcukproxy library object: building (v0.2.0)"""
META = {"name": "building", "keywords": ["building", "skyline"]}


def draw(d, x, base_y, frame, rng, width=60, color=None):
    bh = rng.randrange(80, 200) if rng else 120
    d.rectangle((x, base_y - bh, x + width, base_y), fill=color or rng.choice(["#232526", "#2b2d31", "#3a3d42"]) if rng else "#2b2d31")
    for wy in range(base_y - bh + 12, base_y - 10, 22):
        for wx in range(x + 8, x + width - 8, 16):
            lit = rng.random() > 0.5 if rng else False
            if lit:
                d.rectangle((wx, wy, wx + 6, wy + 8), fill=rng.choice(["#ffd93d", "#ff9f43", "#f8f9fa"]))
