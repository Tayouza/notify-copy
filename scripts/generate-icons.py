#!/usr/bin/env python3
"""Gera os icones do NotifyCopy (gradiente indigo->violeta + check branco)."""
from PIL import Image, ImageDraw
import os

ACCENT = (99, 102, 241)      # #6366f1
ACCENT_END = (139, 92, 246)  # #8b5cf6


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size, ss=4):
    W = size * ss

    # gradiente vertical
    grad = Image.new("RGB", (W, W))
    d = ImageDraw.Draw(grad)
    for y in range(W):
        d.line([(0, y), (W, y)], fill=lerp(ACCENT, ACCENT_END, y / (W - 1)))

    # mascara de quadrado arredondado
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, W - 1, W - 1], radius=int(W * 0.235), fill=255
    )

    icon = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    icon.paste(grad, (0, 0), mask)

    draw = ImageDraw.Draw(icon)
    lw = int(W * 0.115)
    pts = [(int(W * 0.28), int(W * 0.53)),
           (int(W * 0.44), int(W * 0.69)),
           (int(W * 0.74), int(W * 0.35))]
    draw.line(pts, fill=(255, 255, 255, 255), width=lw, joint="curve")
    r = lw // 2
    for p in pts:
        draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(255, 255, 255, 255))

    return icon.resize((size, size), Image.LANCZOS)


base = os.path.dirname(os.path.abspath(__file__))
project = os.path.dirname(base)
build_dir = os.path.join(project, "build")
assets_dir = os.path.join(project, "assets")
os.makedirs(build_dir, exist_ok=True)
os.makedirs(assets_dir, exist_ok=True)

make_icon(1024).save(os.path.join(build_dir, "icon.png"))
make_icon(256).save(os.path.join(assets_dir, "icon.png"))
make_icon(512).save(os.path.join(assets_dir, "icon@2x.png"))
print("OK: build/icon.png, assets/icon.png, assets/icon@2x.png")
