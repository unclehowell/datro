"""fcukproxy library scene: space (v0.2.0)"""
META = {"name": "space", "keywords": ["rocket", "space", "galaxy", "planet", "star", "astro", "ufo"]}


def draw(d, frame, total, rng, props):
    sky_gradient(d, (8, 8, 30), (28, 12, 58))
    for _ in range(120):
        x, y = rng.randrange(W), rng.randrange(H)
        tw = 1 + (rng.random() > 0.7)
        d.ellipse((x, y, x + tw, y + tw), fill=(255, 255, 255))
    plx, ply = W - 90, 70
    d.ellipse((plx - 26, ply - 26, plx + 26, ply + 26), fill="#c850c0")
    d.ellipse((plx - 26, ply - 26, plx + 26, ply + 26), outline="#f1faee", width=2)
    d.ellipse((plx - 40, ply - 6, plx + 40, ply + 6), outline="#f1faee", width=3)
    rx, ry = W // 2 - 40, H - 80 - frame * 2
    d.polygon([(rx, ry - 60), (rx - 18, ry - 8), (rx - 18, ry + 40), (rx + 18, ry + 40), (rx + 18, ry - 8)],
              fill="#edf2f4")
    d.polygon([(rx, ry - 60), (rx - 12, ry - 30), (rx + 12, ry - 30)], fill="#e63946")
    d.ellipse((rx - 10, ry + 4, rx + 10, ry + 24), fill="#4d96ff")
    for s in (-1, 1):
        d.polygon([(rx + s * 18, ry + 16), (rx + s * 34, ry + 30), (rx + s * 18, ry + 34)], fill="#e63946")
    fl = 14 + (frame % 6)
    px(d, [(rx - 10, ry + 40), (rx, ry + 40 + fl), (rx + 10, ry + 40)], fill="#f9d423")
