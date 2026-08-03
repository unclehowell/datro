"""fcukproxy library object: scarf (v0.2.0)"""
META = {"name": "scarf", "keywords": ["scarf"]}


def draw(d, cx, cy, scale=1.0, color="#e63946"):
    d.rectangle((cx - 18 * scale, cy + 4 * scale, cx + 18 * scale, cy + 12 * scale), fill=color)
    d.polygon([(cx + 14 * scale, cy + 8 * scale), (cx + 30 * scale, cy + 22 * scale),
               (cx + 24 * scale, cy + 26 * scale), (cx + 10 * scale, cy + 14 * scale)], fill=color)
