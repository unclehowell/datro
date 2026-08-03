"""fcukproxy library scene: nature (v0.2.0)"""
META = {"name": "nature", "keywords": ["nature", "forest", "mountain", "river", "beach", "field", "park", "ocean"]}


def draw(d, frame, total, rng, props):
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
    tx = W - 90
    d.rectangle((tx - 8, H - 120, tx + 8, H - 60), fill="#6b3a2a")
    for i in range(4):
        sway = math.sin(frame / 10.0 + i) * 3
        ry = H - 150 - i * 26
        rr = 34 - i * 5
        d.ellipse((tx - rr + sway, ry - rr, tx + rr + sway, ry + rr), fill="#2a9d8f")
    for y in range(H - 60, H):
        t = (y - (H - 60)) / 60
        d.line((0, y, W, y), fill=(int(70 + t * 40), int(140 + t * 60), int(190 + t * 30)))
    bx = (frame * 2) % (W + 80) - 40
    d.polygon([(bx, H - 34), (bx + 40, H - 34), (bx + 32, H - 22), (bx + 8, H - 22)], fill="#8b5a2b")
    d.line((bx + 20, H - 34, bx + 20, H - 58), fill="#6b3a2a", width=2)
    d.polygon([(bx + 20, H - 58), (bx + 20, H - 40), (bx + 38, H - 48)], fill="#f1faee")
