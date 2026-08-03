"""fcukproxy library scene: bird (v0.2.0)"""
META = {"name": "bird", "keywords": ["bird", "robin", "eagle", "parrot", "owl"]}


def draw(d, frame, total, rng, props):
    if props.get("env"):
        draw_env_bg(d, frame, rng, props["env"])
    else:
        sky_gradient(d, (137, 196, 244), (94, 132, 226))
    cx, cy = W // 2, H // 2 - 20
    flap = math.sin(frame / 4.0)
    bob = math.sin(frame / 6.0) * 6
    body = "#457b9d" if not props["palette"] else props["palette"][0]
    belly = "#e9c46a"
    px(d, [(cx - 30, cy + 14), (cx - 60, cy + 6 + flap * 8), (cx - 52, cy + 26)], fill=body)
    d.ellipse((cx - 30, cy - 18 + bob, cx + 30, cy + 26 + bob), fill=body)
    d.ellipse((cx - 10, cy + 4 + bob, cx + 28, cy + 24 + bob), fill=belly)
    px(d, [(cx - 2, cy - 6 + bob), (cx - 26, cy - 2 + bob - flap * 18), (cx - 24, cy + 14 + bob)], fill="#2a5f8f")
    hx = cx + 26
    d.ellipse((hx - 14, cy - 22 + bob, hx + 20, cy + 4 + bob), fill=body)
    px(d, [(hx + 18, cy - 6 + bob), (hx + 40, cy - 2 + bob), (hx + 18, cy + 2 + bob)], fill="#e76f51")
    d.ellipse((hx + 4, cy - 10 + bob, hx + 10, cy - 4 + bob), fill="#1a1a2e")
    d.ellipse((hx + 6, cy - 9 + bob, hx + 8, cy - 7 + bob), fill="#fff")
    d.line((cx - 8, cy + 26 + bob, cx - 10, cy + 44 + bob), fill="#f4a261", width=2)
    d.line((cx + 6, cy + 26 + bob, cx + 4, cy + 44 + bob), fill="#f4a261", width=2)
    d.line((cx - 16, cy + 44 + bob, cx - 4, cy + 44 + bob), fill="#f4a261", width=2)
    d.line((cx + -2, cy + 44 + bob, cx + 10, cy + 44 + bob), fill="#f4a261", width=2)
    for ccx, ccy in [(80, 50), (360, 80)]:
        d.ellipse((ccx - 20, ccy, ccx + 20, ccy + 12), fill=(255, 255, 255))
        d.ellipse((ccx - 30, ccy - 8, ccx + 30, ccy + 8), fill=(255, 255, 255))
    apply_accessories(d, "bird", hx, cy - 6 + bob, 1, props)
