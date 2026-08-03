"""fcukproxy library object: crown (v0.2.0)"""
META = {"name": "crown", "keywords": ["crown"]}


def draw(d, cx, cy, scale=1.0, color="#ffd93d"):
    w = int(52 * scale)
    h = int(26 * scale)
    px(d, [(cx - w // 2, cy), (cx - w // 2, cy - h // 2), (cx - w // 6, cy - h // 3),
           (cx, cy - h), (cx + w // 6, cy - h // 3), (cx + w // 2, cy - h // 2), (cx + w // 2, cy)], fill=color)
    for i in range(-2, 3):
        d.rectangle((cx + i * 9 * scale - 1 * scale, cy - 2 * scale, cx + i * 9 * scale + 1 * scale, cy), fill="#e63946")
