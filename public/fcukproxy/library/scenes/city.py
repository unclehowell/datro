"""fcukproxy library scene: city (v0.2.0)"""
META = {"name": "city", "keywords": ["city", "skyline", "neon", "urban", "building"]}


def draw(d, frame, total, rng, props):
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
    for _ in range(3):
        cy = H - 24 - (frame * 2 + _ * 40) % 40
        d.ellipse((0, cy, 12, cy + 6), fill="#ff6b6b")
        d.ellipse((W - 12, cy, W, cy + 6), fill="#4d96ff")
