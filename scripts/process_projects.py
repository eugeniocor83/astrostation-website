"""
Process Astro Station project photographs from PROYECTOS ASTRO/ into web-ready
img/projects/[slug]/ structure.

For each project:
  - Resize all images to max 1800px on long edge (JPG q82)
  - Rename to clean web slug (01.jpg, 02.jpg, ... ordered by source filename)
  - Pick image 01 as hero (the first image, typically the "money shot")
  - Build manifest entry with metadata for the Work page
"""
import os, shutil, re
from pathlib import Path
from PIL import Image

ROOT = Path("/sessions/eloquent-modest-edison/mnt/Astro Station - AAG 2026/website")
SRC = ROOT / "PROYECTOS ASTRO"
DST = ROOT / "img" / "projects"
DST.mkdir(parents=True, exist_ok=True)

# Project catalog: source folder → web slug + metadata
# (kind: residential / restaurant. Tags pick relevant service tags)
PROJECTS = [
    # Residential (VIVIENDA)
    ("VIVIENDA/NAUTILIUS/NAUTILIUS_RENDERS",         "nautilius",       "Nautilius House",       "residential", "design,interior,rendering"),
    ("VIVIENDA/PARALLEL/PARALLEL_RENDERS",           "parallel",        "Parallel House",        "residential", "design,interior,rendering"),
    ("VIVIENDA/211/211_RENDERS",                     "211-house",       "211 House",             "residential", "design,interior,rendering"),
    ("VIVIENDA/JEFFERSON/JEFFERSON_RENDERS",         "jefferson",       "Jefferson House",       "residential", "design,interior,rendering"),
    ("VIVIENDA/235/235_RENDERS",                     "235-house",       "235 House",             "residential", "design,rendering"),
    ("VIVIENDA/233/233_RENDERS",                     "233-house",       "233 House",             "residential", "design,interior,rendering"),
    ("VIVIENDA/ESPAÑOLA/ESPAÑOLA__RENDERS",          "espanola-house",  "Española House",        "residential", "design,rendering"),
    ("VIVIENDA/TIGERTAIL/TIGERTAIL_RENDERS",         "tigertail",       "Tigertail",             "residential", "design,interior,rendering"),
    ("VIVIENDA/72/72_RENDERS",                       "72-house",        "72 House",              "residential", "design,interior,rendering"),
    ("VIVIENDA/MIRANDA/MIRANDA_RENDERS",             "miranda",         "Miranda House",         "residential", "design,interior,rendering"),
    ("VIVIENDA/285/285_RENDERS",                     "285-house",       "285 House",             "residential", "design,interior,rendering"),
    ("VIVIENDA/POMPANO/POMPANO_RENDERS",             "pompano",         "Pompano House",         "residential", "design,interior,rendering"),
    ("VIVIENDA/SAMANA/SAMANA_RENDERS",               "samana",          "Samana House",          "residential", "design,interior,rendering"),
    ("VIVIENDA/HANNAFORD/HANNAFORD__RENDERS",        "hannaford",       "Hannaford House",       "residential", "design,rendering"),
    ("VIVIENDA/BUDDHA/BUDDHA_RENDERS",               "buddha",          "Buddha House",          "residential", "design,interior,rendering"),
    ("VIVIENDA/84/84_RENDERS",                       "84-house",        "84 House",              "residential", "design,rendering"),
    ("VIVIENDA/ADRIANA/ADRIANA_RENDERS",             "adriana",         "Adriana House",         "residential", "design,interior,rendering"),

    # Restaurants (RESTAURANTE)
    ("RESTAURANTE/LA VICTORIA/LA VICTORIA_RENDERS",                                              "la-victoria",       "La Victoria",         "restaurant", "interior,rendering"),
    ("RESTAURANTE/EL CIELO - N.Y/EL CIELO - N.Y_RENDERS",                                        "el-cielo-ny",       "El Cielo · NY",       "restaurant", "interior,rendering"),
    ("RESTAURANTE/EL CIELO - MIAMI/EL CIELO - MIAMI_RENDERS",                                    "el-cielo-miami",    "El Cielo · Miami",    "restaurant", "interior,rendering"),
    ("RESTAURANTE/EL CIELO - MEDELLIN/EL CIELO - MEDELLIN_RENDERS",                              "el-cielo-medellin", "El Cielo · Medellín", "restaurant", "interior,rendering"),
    ("RESTAURANTE/BAKERY/BAKERY_RENDERS",                                                        "bakery",            "The Bakery",          "restaurant", "interior,rendering"),
    ("RESTAURANTE/NIDO DE AGUA - LOBBY & RESTAURANTE/NIDO DE AGUA-RESTAURANTE/NIDO DE AGUA-RESTAURANTE_RENDERS", "nido-de-agua-restaurante", "Nido de Agua · Restaurante", "restaurant", "interior,rendering"),
    ("RESTAURANTE/NIDO DE AGUA - LOBBY & RESTAURANTE/NIDO DE AGUA-LOBBY/NIDO DE AGUA-LOBBY_RENDERS",            "nido-de-agua-lobby",       "Nido de Agua · Lobby",       "restaurant", "interior,rendering"),
    ("RESTAURANTE/THE RIVER/THE RIVER_RENDERS",                                                  "the-river",         "The River",           "restaurant", "interior,rendering"),
    ("RESTAURANTE/AROMAS DEL PERU/AROMAS DEL PERU_RENDERS",                                      "aromas-del-peru",   "Aromas del Perú",     "restaurant", "interior,rendering"),
    ("RESTAURANTE/ESPAÑOLA WAY/ESPAÑOLA WAY_RENDERS",                                            "espanola-way",      "Española Way",        "restaurant", "interior,rendering"),
]

def natural_key(s):
    """Sort filenames naturally so '(2)' comes before '(10)'."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', s)]

def process_image(src_path, dst_path, max_dim=1800, quality=82):
    """Resize + save as JPG."""
    try:
        im = Image.open(src_path).convert("RGB")
        if max(im.size) > max_dim:
            im.thumbnail((max_dim, max_dim), Image.LANCZOS)
        im.save(dst_path, "JPEG", quality=quality, optimize=True)
        return True
    except Exception as e:
        print(f"   ! err {src_path.name}: {e}")
        return False

manifest = []

for src_rel, slug, name, kind, tags in PROJECTS:
    src_dir = SRC / src_rel
    if not src_dir.exists():
        print(f"!! missing {src_rel}")
        continue

    dst_dir = DST / slug
    dst_dir.mkdir(parents=True, exist_ok=True)

    # Collect source images, sort naturally
    imgs = sorted(
        [p for p in src_dir.iterdir()
         if p.suffix.lower() in (".jpg",".jpeg",".png")],
        key=lambda p: natural_key(p.name)
    )

    if not imgs:
        print(f"!! no images in {src_rel}")
        continue

    print(f"\n→ {slug}  ({name})  · {len(imgs)} src images")

    written = []
    # Cap at 16 images per project to keep payload manageable
    for i, src_img in enumerate(imgs[:16], start=1):
        out_name = f"{i:02d}.jpg"
        out_path = dst_dir / out_name
        if process_image(src_img, out_path):
            written.append(out_name)

    if not written:
        continue

    # 01.jpg = hero. Card = same as hero (resized portrait crop next).
    # Make a card.jpg = first image, cropped to portrait 4:5 from center
    hero_path = dst_dir / written[0]
    try:
        im = Image.open(hero_path)
        w, h = im.size
        # Crop to 4:5 portrait, centered
        target_ratio = 4/5
        cur_ratio = w/h
        if cur_ratio > target_ratio:
            # too wide → crop sides
            new_w = int(h * target_ratio)
            x0 = (w - new_w)//2
            im = im.crop((x0, 0, x0+new_w, h))
        else:
            # too tall → crop top/bottom
            new_h = int(w / target_ratio)
            y0 = (h - new_h)//2
            im = im.crop((0, y0, w, y0+new_h))
        im.thumbnail((1200, 1500), Image.LANCZOS)
        im.save(dst_dir / "card.jpg", "JPEG", quality=85, optimize=True)
    except Exception as e:
        print(f"   ! card err: {e}")

    manifest.append({
        "slug": slug,
        "name": name,
        "kind": kind,
        "tags": tags,
        "image_count": len(written),
        "hero": written[0],
        "card": "card.jpg",
        "gallery": written,
    })

# Write manifest as JSON
import json
with open(DST / "manifest.json", "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"\n=== DONE ===")
print(f"Processed {len(manifest)} projects")
total_imgs = sum(p["image_count"] for p in manifest)
print(f"Total web-ready images: {total_imgs}")
print(f"Manifest: {DST / 'manifest.json'}")
