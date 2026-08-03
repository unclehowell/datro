"""fcukproxy library object: tree (v0.2.0)"""
META = {"name": "tree", "keywords": ["tree"]}


def draw(d, x, base_y, frame, scale=1.0, color="#2a9d8f"):
    tx = x
    d.rectangle((tx - int(8 * scale), base_y - int(60 * scale), tx + int(8 * scale), base_y), fill="#6b3a2a")
    for i in range(4):
        sway = math.sin(frame / 10.0 + i) * 3
        ry = base_y - int((30 + i * 26) * scale)
        rr = int((34 - i * 5) * scale)
        d.ellipse((tx - rr + sway, ry - rr, tx + rr + sway, ry + rr), fill=color)
