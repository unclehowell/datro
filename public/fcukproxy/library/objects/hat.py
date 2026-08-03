"""fcukproxy library object: hat (v0.2.0)"""
META = {"name": "hat", "keywords": ["hat", "top hat"]}


def draw(d, cx, cy, scale=1.0, color="#1a1a2e"):
    brim_w, brim_h = int(70 * scale), int(8 * scale)
    crown_w, crown_h = int(44 * scale), int(46 * scale)
    d.rectangle((cx - brim_w // 2, cy - 6 * scale, cx + brim_w // 2, cy + brim_h), fill=color)
    d.rectangle((cx - crown_w // 2, cy - 46 * scale, cx + crown_w // 2, cy), fill=color)
    d.rectangle((cx - crown_w // 2 - 3 * scale, cy - 46 * scale, cx + crown_w // 2 + 3 * scale, cy - 44 * scale),
                fill="#f4a261")
