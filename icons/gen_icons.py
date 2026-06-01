#!/usr/bin/env python3
"""Generate PWA icons for Budget Tracker: a flat wallet glyph on the brand navy."""
from PIL import Image, ImageDraw

NAVY = (15, 23, 42, 255)       # #0f172a  brand background
GREEN = (74, 222, 128, 255)    # #4ade80  remaining-balance green
NAVY_SOFT = (30, 41, 59, 255)  # #1e293b  clasp / notch

SS = 4  # supersampling factor for smooth edges


def draw_wallet(canvas_px, content_ratio, rounded_bg):
    """Render one icon. content_ratio = wallet footprint vs canvas (smaller => more padding)."""
    S = canvas_px * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background
    if rounded_bg:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=NAVY)
    else:
        d.rectangle([0, 0, S - 1, S - 1], fill=NAVY)

    # Wallet body
    w = int(S * content_ratio)
    h = int(w * 0.74)
    x0 = (S - w) // 2
    y0 = (S - h) // 2
    x1, y1 = x0 + w, y0 + h
    r = int(h * 0.20)
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=GREEN)

    # Top fold line (a slightly inset navy band along the upper edge of the wallet)
    fold_h = int(h * 0.20)
    d.rounded_rectangle(
        [x0 + int(w * 0.10), y0 + int(h * 0.12), x1 - int(w * 0.10), y0 + int(h * 0.12) + fold_h],
        radius=fold_h // 2,
        fill=NAVY,
    )

    # Clasp pocket on the right edge: rounded navy square with a green snap dot
    pw = int(w * 0.30)
    ph = int(h * 0.46)
    px1 = x1 - int(w * 0.06)
    px0 = px1 - pw
    pcy = (y0 + y1) // 2
    py0 = pcy - ph // 2
    py1 = pcy + ph // 2
    d.rounded_rectangle([px0, py0, px1, py1], radius=int(ph * 0.28), fill=NAVY)
    dot_r = int(ph * 0.16)
    dcx = px0 + int(pw * 0.42)
    d.ellipse([dcx - dot_r, pcy - dot_r, dcx + dot_r, pcy + dot_r], fill=GREEN)

    return img.resize((canvas_px, canvas_px), Image.LANCZOS)


def main():
    # Standard "any" icons: full-bleed square, generous wallet
    draw_wallet(192, 0.62, rounded_bg=False).save("icon-192.png")
    draw_wallet(512, 0.62, rounded_bg=False).save("icon-512.png")
    # Maskable: keep wallet inside the central ~60% safe zone
    draw_wallet(512, 0.46, rounded_bg=False).save("icon-maskable-512.png")
    # Apple touch icon: iOS rounds automatically, give it a square bg
    draw_wallet(180, 0.60, rounded_bg=False).save("apple-touch-icon.png")
    # Favicon
    draw_wallet(64, 0.64, rounded_bg=True).save("favicon-64.png")
    print("icons written")


if __name__ == "__main__":
    main()
