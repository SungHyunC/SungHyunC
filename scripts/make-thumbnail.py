#!/usr/bin/env python3
"""Turns a screenshot into a project thumbnail for README.md.

    python3 scripts/make-thumbnail.py SOURCE NAME [--crop X,Y,W,H]

Writes assets/projects/NAME.webp: 800 x 500 with rounded corners and a hairline border that
shows on both light and dark pages. --crop picks a region of SOURCE in pixels; the region
(or the whole image) is then trimmed around its centre to 16:10. Needs Pillow.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw

WIDTH, HEIGHT = 800, 500
RADIUS = 22
BORDER = (128, 136, 146, 120)
# Transparent rows above and below the picture. GitHub pads table cells 13px at the sides but
# only 6px at the top and bottom, so without these the picture sits against the cell's edges.
PADDING = 18
SUPERSAMPLE = 4  # the corners and the border are drawn large, then scaled down, to smooth them

parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
parser.add_argument('source', type=Path)
parser.add_argument('name')
parser.add_argument('--crop', help='X,Y,W,H in source pixels')
args = parser.parse_args()

image = Image.open(args.source).convert('RGB')
if args.crop:
    x, y, w, h = (int(v) for v in args.crop.split(','))
    image = image.crop((x, y, x + w, y + h))

# Trim around the centre to 16:10.
target = WIDTH / HEIGHT
if image.width / image.height > target:
    w = round(image.height * target)
    x = (image.width - w) // 2
    image = image.crop((x, 0, x + w, image.height))
else:
    h = round(image.width / target)
    y = (image.height - h) // 2
    image = image.crop((0, y, image.width, y + h))
image = image.resize((WIDTH, HEIGHT), Image.LANCZOS)

big = (WIDTH * SUPERSAMPLE, HEIGHT * SUPERSAMPLE)
mask = Image.new('L', big, 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, big[0] - 1, big[1] - 1], radius=RADIUS * SUPERSAMPLE, fill=255)
border = Image.new('RGBA', big, (0, 0, 0, 0))
ImageDraw.Draw(border).rounded_rectangle(
    [SUPERSAMPLE, SUPERSAMPLE, big[0] - 1 - SUPERSAMPLE, big[1] - 1 - SUPERSAMPLE],
    radius=(RADIUS - 1) * SUPERSAMPLE, outline=BORDER, width=2 * SUPERSAMPLE)

picture = Image.alpha_composite(image.convert('RGBA'), border.resize((WIDTH, HEIGHT), Image.LANCZOS))
picture.putalpha(mask.resize((WIDTH, HEIGHT), Image.LANCZOS))
thumbnail = Image.new('RGBA', (WIDTH, HEIGHT + 2 * PADDING), (0, 0, 0, 0))
thumbnail.paste(picture, (0, PADDING))

out = Path(__file__).resolve().parent.parent / 'assets' / 'projects' / f'{args.name}.webp'
out.parent.mkdir(parents=True, exist_ok=True)
thumbnail.save(out, 'WEBP', quality=86, method=6)
print(f'{out.relative_to(out.parent.parent.parent)}: {out.stat().st_size // 1024} KB')
