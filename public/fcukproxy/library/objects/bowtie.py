"""fcukproxy library object: bowtie (v0.2.0)"""
META = {"name": "bowtie", "keywords": ["bowtie"]}


def draw(d, cx, cy, scale=1.0):
    s = int(12 * scale)
    px(d, [(cx - s, cy), (cx, cy - s), (cx + s, cy), (cx, cy + s)], fill="#e63946")
