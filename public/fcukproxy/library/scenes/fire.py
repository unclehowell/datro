"""fcukproxy library scene: fire (v0.2.0)"""
META = {"name": "fire", "keywords": ["fire", "flame", "campfire", "burn"]}


def draw(d, frame, total, rng, props):
    sky_gradient(d, (30, 12, 12), (10, 6, 10))
    cx = W // 2
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
    for _ in range(14):
        ex = cx + rng.uniform(-80, 80)
        ey = H - 40 - ((frame * 2 + rng.random() * 30) % 120)
        d.ellipse((ex, ey, ex + 3, ey + 3), fill="#ffd93d")
