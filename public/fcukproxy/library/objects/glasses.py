"""fcukproxy library object: glasses (v0.2.0)"""
META = {"name": "glasses", "keywords": ["glasses", "sunglasses"]}


def draw(d, cx, cy, scale=1.0):
    r = int(14 * scale)
    for dx in (-16, 16):
        d.ellipse((cx + dx * scale - r, cy - r, cx + dx * scale + r, cy + r), outline="#222", width=int(2 * scale))
    d.line((cx - 16 * scale + r, cy, cx + 16 * scale - r, cy), fill="#222", width=int(2 * scale))
