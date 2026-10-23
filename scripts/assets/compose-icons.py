"""Render the ">_" prompt mark as app/icon.svg, app/favicon.ico and app/apple-icon.png.

The mark is pure geometry on a 64-unit grid so it stays crisp at 16px and
does not depend on any installed font.

Usage: python3 scripts/assets/compose-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]

BG = "#0A0A0B"
BORDER = "#26262A"
ACCENT = "#00FF88"
TEXT = "#E4E4E7"

# Geometry on a 64x64 grid.
RADIUS = 14
CHEVRON = [(16, 20), (30, 32), (16, 44)]
CHEVRON_WIDTH = 7
CURSOR = (34, 40, 50, 46)

SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="{RADIUS}" fill="{BG}" stroke="{BORDER}" stroke-width="2"/>
  <polyline points="{' '.join(f'{x},{y}' for x, y in CHEVRON)}" fill="none" stroke="{ACCENT}" stroke-width="{CHEVRON_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="{CURSOR[0]}" y="{CURSOR[1]}" width="{CURSOR[2] - CURSOR[0]}" height="{CURSOR[3] - CURSOR[1]}" rx="1.5" fill="{TEXT}"/>
</svg>
"""


def render(size: int, rounded: bool = True) -> Image.Image:
    # Draw at 8x and downsample for anti-aliasing.
    scale = size * 8 / 64
    big = size * 8
    image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    s = lambda v: round(v * scale)  # noqa: E731

    if rounded:
        draw.rounded_rectangle((s(1), s(1), s(63), s(63)), radius=s(RADIUS), fill=BG, outline=BORDER, width=max(1, s(2)))
    else:
        # iOS applies its own mask; a full-bleed square avoids a dark ring.
        draw.rectangle((0, 0, big, big), fill=BG)

    points = [(s(x), s(y)) for x, y in CHEVRON]
    width = s(CHEVRON_WIDTH)
    draw.line(points, fill=ACCENT, width=width, joint="curve")
    for x, y in (points[0], points[-1]):
        draw.ellipse((x - width / 2, y - width / 2, x + width / 2, y + width / 2), fill=ACCENT)
    draw.rounded_rectangle(tuple(s(v) for v in CURSOR), radius=s(1.5), fill=TEXT)

    return image.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    (ROOT / "app/icon.svg").write_text(SVG)
    render(256).save(ROOT / "app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    render(180, rounded=False).convert("RGB").save(ROOT / "app/apple-icon.png", optimize=True)
    for name in ("app/icon.svg", "app/favicon.ico", "app/apple-icon.png"):
        print(f"wrote {name}")
