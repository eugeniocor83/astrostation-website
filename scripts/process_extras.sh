#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# Astro Station — process missing project renders + rasterize
# architectural drawings (plans, sections, elevations, 3D)
# from PROYECTOS ASTRO/ into web-ready img/projects/ structure.
#
# Uses macOS-native `sips` (no Python deps).
# ───────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
SRC="$ROOT/PROYECTOS ASTRO"
DST="$ROOT/img/projects"
MAX_DIM=1800
JPG_Q=82
mkdir -p "$DST"

# ── helper: resize one image to MAX_DIM long-edge JPEG ──
resize_jpg() {
  local in="$1" out="$2"
  # First convert to jpeg into a temp file then resample
  local tmp; tmp=$(mktemp -t astro).jpg
  sips -s format jpeg -s formatOptions ${JPG_Q} "$in" --out "$tmp" >/dev/null
  sips -Z ${MAX_DIM} "$tmp" --out "$out" >/dev/null
  rm -f "$tmp"
}

# ── helper: build a portrait 4:5 card.jpg from a hero ──
make_card() {
  local in="$1" out="$2"
  # First copy to working file
  local tmp; tmp=$(mktemp -t astro).jpg
  cp "$in" "$tmp"
  # Read dims
  local w h
  w=$(sips -g pixelWidth "$tmp" | awk '/pixelWidth:/ {print $2}')
  h=$(sips -g pixelHeight "$tmp" | awk '/pixelHeight:/ {print $2}')
  # Target 4:5 portrait
  local new_w new_h
  if (( $(echo "$w * 5 > $h * 4" | bc) )); then
    # too wide → crop sides
    new_w=$(( h * 4 / 5 ))
    sips -c $h $new_w "$tmp" >/dev/null
  else
    # too tall → crop top/bottom
    new_h=$(( w * 5 / 4 ))
    sips -c $new_h $w "$tmp" >/dev/null
  fi
  sips -Z 1500 "$tmp" --out "$out" >/dev/null
  rm -f "$tmp"
}

# ── helper: rasterize a PDF page to a JPG ──
pdf_to_jpg() {
  local in="$1" out="$2"
  sips -s format jpeg -s formatOptions ${JPG_Q} "$in" --out "$out" >/dev/null 2>&1 || return 1
  # Re-cap to MAX_DIM
  local w
  w=$(sips -g pixelWidth "$out" | awk '/pixelWidth:/ {print $2}')
  if (( w > MAX_DIM )); then
    sips -Z ${MAX_DIM} "$out" --out "$out" >/dev/null
  fi
  return 0
}

# ───────────────────────────────────────────────────────────
# PART 1 — Missing residential projects (renders)
# Tuples: <slug> | <SOURCE_RENDERS_DIR>
# ───────────────────────────────────────────────────────────
echo "── Part 1 · processing missing residential renders ──"

declare -a MISSING
MISSING+=(
  "tigertail-court|VIVIENDA/TIGERTAIL CT/TIGERTAIL CT_RENDERS"
  "temple-house|VIVIENDA/TEMPLE HOUSE/TEMPLE HOUSE_FOTOS"
  "la-rampa|VIVIENDA/LA RAMPA/LA RAMPA_RENDERS"
  "port-charlotte|VIVIENDA/PORT CHARLOTTE/PORT CHARLOTTE_RENDERS"
  "sans-souci|VIVIENDA/SANS SOUCI/SANS SOUCI_RENDERS"
  "nicolas-turbay|VIVIENDA/NICOLAS TURBAY/NICOLAS TURBAY_RENDERS"
  "town-houses|VIVIENDA/TOWN HOUSES/TOWN HOUSES_RENDERS"
)

for entry in "${MISSING[@]}"; do
  slug="${entry%%|*}"
  rel="${entry##*|}"
  src_dir="$SRC/$rel"
  dst_dir="$DST/$slug"
  if [[ ! -d "$src_dir" ]]; then
    echo "!! missing source: $rel"
    continue
  fi
  mkdir -p "$dst_dir"
  echo "  → $slug   (from: $rel)"
  # collect renders sorted
  i=1
  # Use find + sort for natural-ish ordering
  while IFS= read -r f; do
    out="$dst_dir/$(printf "%02d" $i).jpg"
    if [[ -f "$out" ]]; then
      i=$(( i + 1 )); continue
    fi
    if resize_jpg "$f" "$out"; then
      i=$(( i + 1 ))
    fi
    if [[ $i -gt 12 ]]; then break; fi   # cap at 12 renders per project
  done < <(find "$src_dir" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | LC_ALL=C sort)

  # Card from hero
  if [[ -f "$dst_dir/01.jpg" && ! -f "$dst_dir/card.jpg" ]]; then
    make_card "$dst_dir/01.jpg" "$dst_dir/card.jpg"
  fi
done

# ───────────────────────────────────────────────────────────
# PART 2 — Architectural drawings for ALL projects
# Curated drawing set (per project):
#   level-1.jpg  ← LEVEL 1 plan (floor plan)
#   elevation-1.jpg ← key elevation
#   section-a.jpg  ← key section
#   3d.jpg        ← 3D view if available
# ───────────────────────────────────────────────────────────
echo
echo "── Part 2 · rasterizing architectural drawings ──"

# Map slug → source folder name (case sensitive)
declare -a DRAWINGS
DRAWINGS+=(
  # Residential
  "nautilius|VIVIENDA/NAUTILIUS|NAUTILUS"
  "parallel|VIVIENDA/PARALLEL|PARALLEL"
  "211-house|VIVIENDA/211|211 HOUSE"
  "jefferson|VIVIENDA/JEFFERSON|JEFFERSON"
  "235-house|VIVIENDA/235|235"
  "233-house|VIVIENDA/233|233"
  "espanola-house|VIVIENDA/ESPAÑOLA|ESPAÑOLA"
  "tigertail|VIVIENDA/TIGERTAIL|TIGERTAIL"
  "72-house|VIVIENDA/72|72 HOUSE"
  "miranda|VIVIENDA/MIRANDA|MIRANDA"
  "285-house|VIVIENDA/285|285 HOUSE"
  "pompano|VIVIENDA/POMPANO|POMPANO"
  "samana|VIVIENDA/SAMANA|SAMANA"
  "hannaford|VIVIENDA/HANNAFORD|HANNAFORD"
  "buddha|VIVIENDA/BUDDHA|BUDDHA"
  "84-house|VIVIENDA/84|84 HOUSE"
  "adriana|VIVIENDA/ADRIANA|ADRIANA"
  "tigertail-court|VIVIENDA/TIGERTAIL CT|TIGERTAIL CT"
  "temple-house|VIVIENDA/TEMPLE HOUSE|TEMPLE HOUSE"
  "la-rampa|VIVIENDA/LA RAMPA|LA RAMPA"
  "port-charlotte|VIVIENDA/PORT CHARLOTTE|PORT CHARLOTTE"
  "sans-souci|VIVIENDA/SANS SOUCI|SANS SOUCI"
  "nicolas-turbay|VIVIENDA/NICOLAS TURBAY|NICOLAS TURBAY"
  "town-houses|VIVIENDA/TOWN HOUSES|TOWN HOUSES"
  # Restaurants
  "la-victoria|RESTAURANTE/LA VICTORIA|LA VICTORIA"
  "el-cielo-ny|RESTAURANTE/EL CIELO - N.Y|EL CIELO - N.Y"
  "el-cielo-miami|RESTAURANTE/EL CIELO - MIAMI|EL CIELO - MIAMI"
  "el-cielo-medellin|RESTAURANTE/EL CIELO - MEDELLIN|EL CIELO - MEDELLIN"
  "bakery|RESTAURANTE/BAKERY|BAKERY"
  "the-river|RESTAURANTE/THE RIVER|THE RIVER"
  "aromas-del-peru|RESTAURANTE/AROMAS DEL PERU|AROMAS DEL PERU"
  "espanola-way|RESTAURANTE/ESPAÑOLA WAY|ESPANOLA WAY"
)

# helper to find first match (a glob-ish search across the source dir)
first_match() {
  local dir="$1" pattern="$2"
  find "$dir" -maxdepth 1 -type f -iname "$pattern" 2>/dev/null | LC_ALL=C sort | head -n 1
}

for entry in "${DRAWINGS[@]}"; do
  IFS='|' read -r slug rel prefix <<< "$entry"
  src_dir="$SRC/$rel"
  dst_dir="$DST/$slug/plans"
  if [[ ! -d "$src_dir" ]]; then
    echo "!! drawings: missing source $rel"
    continue
  fi
  mkdir -p "$dst_dir"

  # Try multiple naming patterns (some files use NAUTILUS vs NAUTILIUS, etc.)
  level1=$(first_match "$src_dir" "*LEVEL 1*.pdf")
  [[ -z "$level1" ]] && level1=$(first_match "$src_dir" "*GROUND LEVEL*.pdf")
  [[ -z "$level1" ]] && level1=$(first_match "$src_dir" "*LEVEL*1*.pdf")
  elev=$(first_match "$src_dir" "*ELEVATION 1*.pdf")
  [[ -z "$elev" ]] && elev=$(first_match "$src_dir" "*ELEVATION A*.pdf")
  [[ -z "$elev" ]] && elev=$(first_match "$src_dir" "*ELEVATION*1*.pdf")
  sect=$(first_match "$src_dir" "*SECTION A*.pdf")
  [[ -z "$sect" ]] && sect=$(first_match "$src_dir" "*SECTION 1*.pdf")
  [[ -z "$sect" ]] && sect=$(first_match "$src_dir" "*SECTION*A*.pdf")
  d3=$(first_match "$src_dir" "*3D*.pdf")

  count=0
  if [[ -n "$level1" ]]; then pdf_to_jpg "$level1" "$dst_dir/level-1.jpg" && count=$((count+1)); fi
  if [[ -n "$elev"   ]]; then pdf_to_jpg "$elev"   "$dst_dir/elevation-1.jpg" && count=$((count+1)); fi
  if [[ -n "$sect"   ]]; then pdf_to_jpg "$sect"   "$dst_dir/section-a.jpg" && count=$((count+1)); fi
  if [[ -n "$d3"     ]]; then pdf_to_jpg "$d3"     "$dst_dir/3d.jpg"        && count=$((count+1)); fi

  echo "  → $slug   ($count drawings)"
done

echo
echo "── DONE ──"
