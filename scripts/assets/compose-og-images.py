"""Compose the 1200x630 Open Graph images from the generated background.

The background (scripts/assets/og/background.png) is AI-generated artwork with
no text. Titles are drawn here with the site's own fonts so the copy stays
exact and matches the page typography. CJK text uses Hiragino Sans GB, which
ships with macOS.

Usage: python3 scripts/assets/compose-og-images.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BACKGROUND = ROOT / "scripts/assets/og/background.png"
FONTS = ROOT / "public/fonts"
CJK_FONT = Path("/System/Library/Fonts/Hiragino Sans GB.ttc")

WIDTH, HEIGHT = 1200, 630
MARGIN_X = 72

BG = (10, 10, 11)
TEXT_PRIMARY = (228, 228, 231)
TEXT_SECONDARY = (161, 161, 170)
TEXT_DIM = (113, 113, 122)
ACCENT = (0, 255, 136)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def cjk(size: int, bold: bool) -> ImageFont.FreeTypeFont:
    # The collection holds W3 at index 0 and W6 at index 2.
    return ImageFont.truetype(str(CJK_FONT), size, index=2 if bold else 0)


def base() -> Image.Image:
    art = Image.open(BACKGROUND).convert("RGB")
    scale = WIDTH / art.width
    art = art.resize((WIDTH, round(art.height * scale)), Image.LANCZOS)
    top = (art.height - HEIGHT) // 2
    art = art.crop((0, top, WIDTH, top + HEIGHT))

    # Darken the left side so text never competes with stray particles.
    shade = Image.new("L", (WIDTH, 1))
    for x in range(WIDTH):
        t = min(1.0, x / (WIDTH * 0.62))
        shade.putpixel((x, 0), round(235 * (1 - t) ** 1.6))
    shade = shade.resize((WIDTH, HEIGHT))
    return Image.composite(Image.new("RGB", (WIDTH, HEIGHT), BG), art, shade)


def wrap(draw: ImageDraw.ImageDraw, text: str, face, max_width: int) -> list[str]:
    lines, line = [], ""
    for word in text.split(" "):
        candidate = f"{line} {word}".strip()
        if draw.textlength(candidate, font=face) <= max_width:
            line = candidate
        else:
            lines.append(line)
            line = word
    return lines + [line]


def prompt_line(draw: ImageDraw.ImageDraw, y: int, path: str) -> None:
    mono = font("JetBrainsMono-Medium.woff2", 24)
    draw.text((MARGIN_X, y), "~/", font=mono, fill=ACCENT)
    draw.text((MARGIN_X + draw.textlength("~/", font=mono), y), path, font=mono, fill=TEXT_SECONDARY)


def footer(draw: ImageDraw.ImageDraw, text: str) -> None:
    mono = font("JetBrainsMono-Regular.woff2", 20)
    draw.line((MARGIN_X, HEIGHT - 92, MARGIN_X + 56, HEIGHT - 92), fill=ACCENT, width=3)
    draw.text((MARGIN_X, HEIGHT - 72), text, font=mono, fill=TEXT_DIM)


def home() -> Image.Image:
    image = base()
    draw = ImageDraw.Draw(image)
    prompt_line(draw, 88, "me.ccsert.top")

    title = font("JetBrainsMono-Bold.woff2", 104)
    draw.text((MARGIN_X - 4, 140), "ccsert", font=title, fill=TEXT_PRIMARY)
    cursor_x = MARGIN_X + draw.textlength("ccsert", font=title) + 10
    draw.rectangle((cursor_x, 160, cursor_x + 46, 248), fill=ACCENT)

    headline = font("Inter-SemiBold.woff2", 38)
    y = 298
    for line in wrap(draw, "Turning complex engineering work into tools people can actually use.", headline, 600):
        draw.text((MARGIN_X, y), line, font=headline, fill=TEXT_PRIMARY)
        y += 50

    footer(draw, "Developer tools · AI-assisted engineering · Self-hosted infra")
    return image


def archive() -> Image.Image:
    image = base()
    draw = ImageDraw.Draw(image)
    prompt_line(draw, 88, "archive · ")
    # JetBrains Mono has no CJK glyphs, so the label uses the CJK face.
    mono = font("JetBrainsMono-Medium.woff2", 24)
    label_x = MARGIN_X + draw.textlength("~/archive · ", font=mono)
    draw.text((label_x, 86), "个人实验场", font=cjk(24, bold=False), fill=TEXT_SECONDARY)

    draw.text((MARGIN_X - 2, 146), "别只看，动手玩。", font=cjk(84, bold=True), fill=TEXT_PRIMARY)

    body = cjk(30, bold=False)
    lines = ["给终端换个主题，让文档跨越语言，", "跟随一次制品请求，展开一条代码审查。"]
    y = 284
    for line in lines:
        draw.text((MARGIN_X, y), line, font=body, fill=TEXT_SECONDARY)
        y += 48

    footer(draw, "omz-pm · DocBabel · Artifact Gateway · OpenCode Review")
    return image


if __name__ == "__main__":
    # Some link unfurlers read only twitter:image, so each segment gets both.
    outputs = {
        ROOT / "app": home(),
        ROOT / "app/archive": archive(),
    }
    for segment, image in outputs.items():
        for name in ("opengraph-image.jpg", "twitter-image.jpg"):
            path = segment / name
            image.save(path, quality=88, optimize=True, progressive=True)
            print(f"wrote {path.relative_to(ROOT)}")
