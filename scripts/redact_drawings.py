#!/usr/bin/env python3
"""Redact project address labels from architectural PDFs and emit clean web PDFs.

Rasterizes each source PDF (dropping the text layer entirely, so no address text
remains extractable), paints opaque boxes over address-label clusters
(Lot / Block / Street / NE-NW-SW-SE, etc.), and rebuilds a single-page PDF.

Usage: redact_drawings.py <SRC_DIR> <OUT_DIR> [DPI]
"""
import sys, os, glob, re, subprocess, tempfile
import pdfplumber
from PIL import Image, ImageDraw

SRC = sys.argv[1]
OUT = sys.argv[2]
DPI = int(sys.argv[3]) if len(sys.argv) > 3 else 200
SC = DPI / 72.0
PAD_X, PAD_Y = 74, 38          # point padding around each anchor word
ANCH = re.compile(r'^(lot|block|street|st|ave|avenue|blvd|road|rd|ne|nw|sw|se)$', re.I)

os.makedirs(OUT, exist_ok=True)

def clean_name(base):
    n = base.lower()
    n = re.sub(r'^.*?house[_ ]*', '', n)      # strip "211 HOUSE_" style prefix
    n = re.sub(r'[^a-z0-9]+', '-', n).strip('-')
    return n or 'sheet'

def bg_at(img, box):
    # sample the median-ish corner colour so the patch blends with the sheet bg
    x0, y0, x1, y1 = [int(v) for v in box]
    x0 = max(0, x0); y0 = max(0, y0)
    try:
        px = img.getpixel((max(0, x0 - 4), max(0, y0 - 4)))
        return px
    except Exception:
        return (255, 255, 255)

count = 0
for pdf in sorted(glob.glob(os.path.join(SRC, '*.pdf'))):
    base = os.path.splitext(os.path.basename(pdf))[0]
    with tempfile.TemporaryDirectory() as td:
        stem = os.path.join(td, 'p')
        subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-singlefile', pdf, stem],
                       check=True)
        img = Image.open(stem + '.png').convert('RGB')
        draw = ImageDraw.Draw(img)
        redactions = 0
        with pdfplumber.open(pdf) as p:
            page = p.pages[0]
            # the page mediabox origin may be non-zero; pixel (0,0) maps to (bbox x0, top)
            x_off, y_off = page.bbox[0], page.bbox[1]
            for w in page.extract_words():
                if ANCH.match(w['text'].strip()):
                    box = [(w['x0'] - x_off - PAD_X) * SC, (w['top'] - y_off - PAD_Y) * SC,
                           (w['x1'] - x_off + PAD_X) * SC, (w['bottom'] - y_off + PAD_Y) * SC]
                    draw.rectangle(box, fill=bg_at(img, box))
                    redactions += 1
        out = os.path.join(OUT, clean_name(base) + '.pdf')
        img.save(out, 'PDF', resolution=DPI)
        count += 1
        print(f"{base:32s} -> {os.path.basename(out):22s} ({redactions} labels covered)")
print(f"\n{count} PDFs written to {OUT}")
