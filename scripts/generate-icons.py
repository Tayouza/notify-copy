#!/usr/bin/env python3
"""Gera os icones do NotifyCopy."""

import argparse
import os
from PIL import Image, ImageDraw


# Presets de cor (iguais à spec v0.2)
PRESETS = {
    "indigo": (99, 102, 241),  # #6366f1
    "azul": (59, 130, 246),   # #3b82f6
    "verde": (34, 197, 94),   # #22c55e
    "rosa": (236, 72, 153),   # #ec4899
    "laranja": (249, 115, 22),  # #f97316
    "vermelho": (239, 68, 68), # #ef4444
    "ciano": (6, 182, 212),   # #06b6d4
    "ambar": (245, 158, 11),  # #f59e0b
}

DEFAULT_ACCENT = (99, 102, 241)      # #6366f1
DEFAULT_ACCENT_END = (139, 92, 246)  # #8b5cf6


def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def rgb_to_hex(c):
    return "#{:02x}{:02x}{:02x}".format(*c)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def derive_end(accent, amt=0.12):
    """Deriva um accent_end levemente mais escuro/azulado ou claro."""
    # Para manter look consistente com gradiente indigo->violeta, usaremos
    # um tom levemente mais saturado/escuro (~12% na mistura com azul/roxo)
    # Mantendo coerente com spec: o renderer pode derivar, mas geramos também.
    # Abordagem simples: interpolar com (accent[0]-15, accent[1]-5, min(246, accent[2]+15)) sutil
    end = (
        max(0, min(255, accent[0] - int(15 * 1.0))),
        max(0, min(255, accent[1] - int(5 * 0.8))),
        max(0, min(255, accent[2] + int(15 * 0.6))),
    )
    # Se ficar muito próximo, escurece um pouco mais
    if end == accent:
        end = lerp(accent, (40, 40, 80), 0.15)
    return end


def make_icon(size, accent, accent_end, ss=4):
    W = size * ss

    # gradiente vertical
    grad = Image.new("RGB", (W, W))
    d = ImageDraw.Draw(grad)
    for y in range(W):
        t = y / (W - 1) if W > 1 else 0
        d.line([(0, y), (W, y)], fill=lerp(accent, accent_end, t))

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


def main():
    parser = argparse.ArgumentParser(description="Gera ícones do NotifyCopy")
    parser.add_argument("--color", help="Cor no formato #RRGGBB para gerar ícones com cor personalizada")
    parser.add_argument("--accent-end", help="Cor final do gradiente (#RRGGBB), opcional")
    args = parser.parse_args()

    accent = DEFAULT_ACCENT
    accent_end = DEFAULT_ACCENT_END

    if args.color:
        try:
            accent = hex_to_rgb(args.color)
        except Exception as e:
            print(f"Cor inválida: {args.color}. Usando padrão.")
            accent = DEFAULT_ACCENT
    if args.accent_end:
        try:
            accent_end = hex_to_rgb(args.accent_end)
        except Exception:
            accent_end = derive_end(accent)

    if not args.accent_end and args.color:
        accent_end = derive_end(accent)

    base = os.path.dirname(os.path.abspath(__file__))
    project = os.path.dirname(base)
    build_dir = os.path.join(project, "build")
    assets_dir = os.path.join(project, "assets")
    os.makedirs(build_dir, exist_ok=True)
    os.makedirs(assets_dir, exist_ok=True)

    make_icon(1024, accent, accent_end).save(os.path.join(build_dir, "icon.png"))
    make_icon(256, accent, accent_end).save(os.path.join(assets_dir, "icon.png"))
    make_icon(512, accent, accent_end).save(os.path.join(assets_dir, "icon@2x.png"))
    print("OK: build/icon.png, assets/icon.png, assets/icon@2x.png (accent={}, accent_end={})".format(
        rgb_to_hex(accent), rgb_to_hex(accent_end)
    ))


if __name__ == "__main__":
    main()
