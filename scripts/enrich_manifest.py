#!/usr/bin/env python3
"""
Enrich img/projects/manifest.json with editorial metadata
(neighborhood, city, status, summary), reconcile schema with
files on disk (renders + plans), and produce the final source
of truth used by build_work_pages.py.
"""
import json, os, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DST = ROOT / "img" / "projects"
MANIFEST_PATH = DST / "manifest.json"

# ─────────────────────────────────────────────────────────────
# Editorial metadata, keyed by slug
# ─────────────────────────────────────────────────────────────
META = {
    # ── Residential ──────────────────────────────────────────
    "nautilius": {
        "name": "Nautilius House",
        "neighborhood": "Miami Beach", "city": "Miami Beach, FL",
        "address": "4480 Nautilus Dr, Miami Beach, FL",
        "status": "Concept · Design Development",
        "summary": "A waterfront residence drawn around a single coiled stair — a nautilus folded inside a white volume.",
        "tags": "design,interior,rendering",
    },
    "parallel": {
        "name": "Parallel House",
        "neighborhood": "Upper Eastside, Miami", "city": "Miami, FL",
        "address": "1095 NE 83rd Street, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "Two stacked planes pulled apart and re-aligned. Volumes that track each other like quiet companions.",
        "tags": "design,interior,rendering",
    },
    "211-house": {
        "name": "211 House",
        "neighborhood": "Buena Vista, Miami", "city": "Miami, FL",
        "address": "211 NE 47th St, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A compact urban infill drawn for tropical light and discreet street presence.",
        "tags": "design,interior,rendering",
    },
    "jefferson": {
        "name": "Jefferson House",
        "neighborhood": "Miami Beach", "city": "Miami Beach, FL",
        "address": "4550 Jefferson Avenue, Miami Beach, FL",
        "status": "Concept · Design Development",
        "summary": "A measured Miami Beach residence — a series of framed views from front yard to garden.",
        "tags": "design,interior,rendering",
    },
    "235-house": {
        "name": "235 House",
        "neighborhood": "Buena Vista, Miami", "city": "Miami, FL",
        "address": "235 NE 46th St, Miami, FL",
        "status": "Concept",
        "summary": "An exploratory study — three quiet volumes arranged around a courtyard.",
        "tags": "design,rendering",
    },
    "233-house": {
        "name": "233 House",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "233 Shore Dr E, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A waterfront residence drawn for long horizons and shaded interior weather.",
        "tags": "design,interior,rendering",
    },
    "espanola-house": {
        "name": "Española House",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "1750 Española Drive, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A measured Coconut Grove home — coral-stone base, white plaster mass, deep shaded loggia.",
        "tags": "design,rendering",
    },
    "tigertail": {
        "name": "Tigertail House",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "1953 Tigertail Ave, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A tall, narrow Grove residence — a stack of climates around a central living core.",
        "tags": "design,interior,rendering",
    },
    "tigertail-ct": {
        "name": "Tigertail Court",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "2321 Tigertail Court, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A second residence on the Tigertail axis — a courtyard plan held inside a single white frame.",
        "tags": "design,interior,rendering",
    },
    "72-house": {
        "name": "72 House",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "72 W Shore Dr, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A west-shore courtyard residence — water on one side, garden on the other, the house in between.",
        "tags": "design,interior,rendering",
    },
    "miranda": {
        "name": "Miranda House",
        "neighborhood": "Coral Gables", "city": "Coral Gables, FL",
        "address": "13010 Miranda St, Coral Gables, FL",
        "status": "Concept · Design Development",
        "summary": "A Gables residence built on long axial views — a single corridor that becomes the house.",
        "tags": "design,interior,rendering",
    },
    "285-house": {
        "name": "285 House",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "285 Shore Dr E, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A waterfront residence held in two parallel planes — sky above, water below, the house between.",
        "tags": "design,interior,rendering",
    },
    "pompano": {
        "name": "Pompano House",
        "neighborhood": "Pompano Beach", "city": "Pompano Beach, FL",
        "address": "2601 NE 8th Ct, Pompano Beach, FL",
        "status": "Concept · Design Development",
        "summary": "A coastal residence drawn around a single courtyard — calm at the centre, sun at the perimeter.",
        "tags": "design,interior,rendering",
    },
    "samana": {
        "name": "Samana House",
        "neighborhood": "Coconut Grove, Miami", "city": "Miami, FL",
        "address": "31 Samana Dr, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A Grove residence drawn around a still water court — interior and exterior held under one frame.",
        "tags": "design,interior,rendering",
    },
    "hannaford": {
        "name": "Hannaford House",
        "neighborhood": "Key Biscayne", "city": "Key Biscayne, FL",
        "address": "50 Cape Florida Dr, Key Biscayne, FL",
        "status": "Concept · Design Development",
        "summary": "An island residence — a quiet corridor of rooms tracking the long edge of the lot.",
        "tags": "design,rendering",
    },
    "buddha": {
        "name": "Buddha House",
        "neighborhood": "Upper Eastside, Miami", "city": "Miami, FL",
        "address": "1091 NE 83rd Street, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A meditative residence held in a single white frame — interior weather drawn around a courtyard.",
        "tags": "design,interior,rendering",
    },
    "84-house": {
        "name": "84 House",
        "neighborhood": "Upper Eastside, Miami", "city": "Miami, FL",
        "address": "1110 NE 84 St, Miami, FL",
        "status": "Concept",
        "summary": "A study in volume — a single white prism cut for shadow, light and street.",
        "tags": "design,rendering",
    },
    "adriana": {
        "name": "Adriana House",
        "neighborhood": "Pinecrest", "city": "Pinecrest, FL",
        "address": "9100 SW 57th Ave, Pinecrest, FL",
        "status": "Concept · Design Development",
        "summary": "A Pinecrest family residence — ground-hugging volumes, deep eaves, generous interior weather.",
        "tags": "design,interior,rendering",
    },
    "temple-house": {
        "name": "Temple House",
        "neighborhood": "Winter Park", "city": "Winter Park, FL",
        "address": "1742 Temple Dr, Winter Park, FL",
        "status": "Built · Photographed",
        "summary": "A built residence in Central Florida. Photographed and delivered.",
        "tags": "design,interior,rendering",
    },
    "la-rampa": {
        "name": "La Rampa",
        "neighborhood": "Coral Gables", "city": "Coral Gables, FL",
        "address": "8281 La Rampa St, Coral Gables, FL",
        "status": "Concept · Design Development",
        "summary": "A Gables residence drawn around a single ramped circulation — a slow inhabited line through the lot.",
        "tags": "design,interior,rendering",
    },
    "port-charlotte": {
        "name": "Port Charlotte House",
        "neighborhood": "Port Charlotte", "city": "Port Charlotte, FL",
        "address": "10378 Harlingen St, Port Charlotte, FL",
        "status": "Concept · Design Development",
        "summary": "A Gulf-coast residence — wide horizons, low planes, interior weather under one continuous roof.",
        "tags": "design,rendering",
    },
    "sans-souci": {
        "name": "Sans Souci",
        "neighborhood": "North Miami", "city": "North Miami, FL",
        "address": "2067 NE 121st Rd, North Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A bayside residence — long horizons, deep eaves, shaded courtyards and a measured presence at the water.",
        "tags": "design,interior,rendering",
    },
    "nicolas-turbay": {
        "name": "Nicolás Turbay House",
        "neighborhood": "Upper Eastside, Miami", "city": "Miami, FL",
        "address": "1075 NE 88th Street, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A residence drawn for a longstanding client — quiet, generous, deeply serviced from a single core.",
        "tags": "design,interior,rendering",
    },
    "town-houses": {
        "name": "Wynwood Town Houses",
        "neighborhood": "Wynwood, Miami", "city": "Miami, FL",
        "address": "4798 NE 2nd Ave, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A small collection of urban townhouses — a quiet residential register inserted into a working neighborhood.",
        "tags": "design,interior,rendering",
    },
    # ── Hospitality ──────────────────────────────────────────
    "la-victoria": {
        "name": "La Victoria",
        "neighborhood": "Little River, Miami", "city": "Miami, FL",
        "address": "6444 NE 4th Ave, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A neighborhood restaurant — a single warm room held inside a quiet shell.",
        "tags": "interior,rendering",
    },
    "el-cielo-ny": {
        "name": "El Cielo · New York",
        "neighborhood": "NoMad, New York", "city": "New York, NY",
        "address": "1227 Broadway, New York, NY",
        "status": "Concept · Design Development",
        "summary": "A New York address for a Colombian fine-dining group — refined, intimate, a slow theatre of plates.",
        "tags": "interior,rendering",
    },
    "el-cielo-miami": {
        "name": "El Cielo · Miami",
        "neighborhood": "Downtown Miami", "city": "Miami, FL",
        "address": "31 SE 5th St, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A Downtown sister to the New York and Medellín restaurants — quiet, layered, deeply lit.",
        "tags": "interior,rendering",
    },
    "el-cielo-medellin": {
        "name": "El Cielo · Medellín",
        "neighborhood": "El Poblado", "city": "Medellín, Colombia",
        "address": "Cl. 7D #43c-36, El Poblado, Medellín",
        "status": "Concept · Design Development",
        "summary": "The mother house of the El Cielo family — a Medellín restaurant returning to its origin.",
        "tags": "interior,rendering",
    },
    "bakery": {
        "name": "The Bakery",
        "neighborhood": "Downtown Miami", "city": "Miami, FL",
        "address": "401 Biscayne Blvd, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A small Downtown bakery — an open kitchen, a long counter, and a quiet street presence.",
        "tags": "interior,rendering",
    },
    "nido-de-agua-restaurante": {
        "name": "Nido de Agua · Restaurant",
        "neighborhood": "El Peñol", "city": "Antioquia, Colombia",
        "address": "Vía Vda. Palestina, Peñol, Antioquia, Colombia",
        "status": "Concept · Design Development",
        "summary": "A countryside restaurant on a Colombian reservoir — broad eaves, exposed timber, a long shared table.",
        "tags": "interior,rendering",
    },
    "nido-de-agua-lobby": {
        "name": "Nido de Agua · Lobby",
        "neighborhood": "El Peñol", "city": "Antioquia, Colombia",
        "address": "Vía Vda. Palestina, Peñol, Antioquia, Colombia",
        "status": "Concept · Design Development",
        "summary": "The arrival sequence of the Nido de Agua hotel — a quiet timber lobby framed by water.",
        "tags": "interior,rendering",
    },
    "the-river": {
        "name": "The River",
        "neighborhood": "Miami River", "city": "Miami, FL",
        "address": "311 NW S River Dr, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A riverside restaurant — water on one side, working city on the other, a single layered room between.",
        "tags": "interior,rendering",
    },
    "aromas-del-peru": {
        "name": "Aromas del Perú",
        "neighborhood": "Brickell, Miami", "city": "Miami, FL",
        "address": "177 SW 7th St, Miami, FL",
        "status": "Concept · Design Development",
        "summary": "A Peruvian dining room in Brickell — warm, layered, deeply considered.",
        "tags": "interior,rendering",
    },
    "espanola-way": {
        "name": "Española Way",
        "neighborhood": "South Beach", "city": "Miami Beach, FL",
        "address": "445 Española Way, Miami Beach, FL",
        "status": "Concept · Design Development",
        "summary": "A South-of-Fifth-adjacent restaurant — a calm white interior on a street that hums all night.",
        "tags": "interior,rendering",
    },
}

# Editorial ordering: featured first (lead the page), then the rest by visual register.
ORDER_RESIDENTIAL = [
    "nautilius", "parallel", "211-house", "buddha", "samana",
    "tigertail", "233-house", "jefferson", "285-house", "miranda",
    "72-house", "tigertail-ct", "pompano", "temple-house", "espanola-house",
    "hannaford", "adriana", "la-rampa", "sans-souci", "nicolas-turbay",
    "port-charlotte", "town-houses", "235-house", "84-house",
]
ORDER_HOSPITALITY = [
    "el-cielo-ny", "the-river", "el-cielo-medellin", "la-victoria", "aromas-del-peru",
    "el-cielo-miami", "bakery", "espanola-way",
    "nido-de-agua-restaurante", "nido-de-agua-lobby",
]
FEATURED = {
    "nautilius", "parallel", "211-house", "buddha", "samana",
    "tigertail", "233-house", "jefferson", "285-house", "temple-house",
    "el-cielo-ny", "the-river", "el-cielo-medellin", "la-victoria", "aromas-del-peru",
}

# Per-project status. Default is derived from material depth (see assign_status).
# Only override with confirmed real status; otherwise the heuristic picks
# Concept / Schematic Design / Design Development.
STATUS_OVERRIDE = {
    "temple-house": "Built · Photographed",   # only project with photo source
}

def assign_status(slug, render_count, plan_count):
    """Choose an honest editorial status from material depth."""
    if slug in STATUS_OVERRIDE:
        return STATUS_OVERRIDE[slug]
    if render_count <= 5 and plan_count <= 1:
        return "Concept"
    if render_count >= 12 and plan_count >= 4:
        return "Design Development"
    if render_count >= 8 and plan_count >= 2:
        return "Design Development"
    return "Schematic Design"

# ─────────────────────────────────────────────────────────────
# Build manifest
# ─────────────────────────────────────────────────────────────
def list_jpgs(d, pattern):
    """Return sorted list of jpgs matching pattern in directory."""
    if not d.exists():
        return []
    files = sorted([p.name for p in d.iterdir() if p.is_file() and pattern.match(p.name)])
    return files

RENDER_RE = re.compile(r"^\d{2}\.jpg$")
PLAN_RE = re.compile(r"^plan-\d{2}\.jpg$")

manifest = []
for slug in ORDER_RESIDENTIAL + ORDER_HOSPITALITY:
    if slug not in META:
        print(f"!! no metadata for {slug}")
        continue
    proj_dir = DST / slug
    if not proj_dir.exists():
        print(f"!! no folder for {slug}")
        continue

    renders = list_jpgs(proj_dir, RENDER_RE)
    plans = list_jpgs(proj_dir, PLAN_RE)
    has_card = (proj_dir / "card.jpg").exists()
    kind = "residential" if slug in ORDER_RESIDENTIAL else "hospitality"
    m = META[slug]

    # Cap renders at 8 for editorial restraint (leaner gallery feels more curated)
    renders_curated = renders[:8]

    manifest.append({
        "slug": slug,
        "name": m["name"],
        "kind": kind,
        "featured": slug in FEATURED,
        "neighborhood": m["neighborhood"],
        "city": m["city"],
        "address": m["address"],
        "status": assign_status(slug, len(renders), len(plans)),
        "summary": m["summary"],
        "tags": m["tags"],
        "render_count": len(renders),
        "plan_count": len(plans),
        "renders": renders_curated,
        "plans": plans,
        "has_card": has_card,
    })

with open(MANIFEST_PATH, "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

residential = sum(1 for p in manifest if p["kind"] == "residential")
hospitality = sum(1 for p in manifest if p["kind"] == "hospitality")
print(f"wrote manifest: {len(manifest)} projects ({residential} residential, {hospitality} hospitality)")
print(f"  with plans:  {sum(1 for p in manifest if p['plan_count'] > 0)}")
print(f"  featured:    {sum(1 for p in manifest if p['featured'])}")
