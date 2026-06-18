# Astro Station — Website

The marketing website for Astro Station, an integrated residential design-build platform based in Miami. Static HTML site, white-base editorial register, designed to be hosted on Webflow or any static host.

## Quick start (Claude Code)

```bash
cd "/Users/eucorrea/Documents/Claude/Projects/Astro Station - AAG 2026/website"
claude
```

Open `index.html` in a browser to preview. Everything is static HTML — no build step. To preview a server-served version:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Brand

- **Owner:** Eu Correa, Principal · Astro Station
- **Voice:** Cosmonaut / space metaphor. "Creative station of architecture and interior design." "Bespoke luxury homes." "Outside the box. Futurist · Liquid · Melted." "Join our journey."
- **Leadership (use this exact order + titles, do not rename):**
  1. **David Castrillón** — Founder & Principal
  2. **Maria Bernal** — Principal · Interior Design
  3. **Eu Correa** — Principal · Strategy
  4. **José Martínez** — GC · Engineer · Director of Construction (leads Astro Cósmico)
- **Service lines (in order):**
  1. Architecture & Design
  2. Interior Design
  3. Millwork — branded **Dragon Division** (in-house shop)
  4. Construction — branded **Astro Cósmico** (in-house GC, led by José Martínez)
  5. Landscape, Patio & Pool
  6. Exterior Re-facing
  7. Rendering Services

## File structure

```
website/
├── index.html               ← homepage (10-slide brand presentation)
├── studio.html              ← about / leadership / team
├── services.html            ← services hub
├── work.html                ← portfolio grid (auto-generated from manifest)
├── journal.html             ← journal index
├── contact.html             ← inquiry form
├── services/
│   ├── architecture.html
│   ├── interiors.html
│   ├── millwork.html        ← Dragon Division
│   ├── built.html           ← Astro Cósmico (José Martínez lead)
│   ├── landscape.html
│   ├── exterior.html
│   └── rendering.html
├── work/
│   └── [slug].html          ← 27 project detail pages, auto-generated
├── assets/
│   ├── styles.css           ← single design-system stylesheet (CSS variables)
│   └── main.js              ← clock + filter chips + form handler
├── img/
│   ├── brand/
│   │   ├── wordmark.png     ← official Astro Station logo (the canonical brand mark)
│   │   ├── slide01-logo.jpg ... slide10-join-our-journey.jpg
│   │   ├── star.png         ← OFFICIAL 8-stroke star mark (use this; transparent PNG)
│   │   ├── asterisk.svg     ← old 6-stroke approximation (superseded by star.png)
│   │   ├── hires/           ← original 4500px source slides (archive)
│   │   └── README.md        ← brand-asset replacement guide
│   ├── projects/
│   │   ├── manifest.json    ← single source of truth for all projects
│   │   ├── [slug]/01.jpg ... 16.jpg + card.jpg   (per project)
│   │   └── README.md        ← upload workflow guide
│   ├── interior/, landscape/, exterior/, millwork/, rendering/   ← service-page imagery
│   └── ...
└── PROYECTOS ASTRO/         ← original high-res project source (Spanish folder names; archive)
```

## Adding a new project

1. Drop new images into `PROYECTOS ASTRO/[CATEGORY]/[NAME]/[NAME]_RENDERS/`
2. Add an entry to the `PROJECTS` list in `process_projects.py` (root tools folder, see scripts/)
3. Run `python3 scripts/process_projects.py` — resizes images and updates manifest
4. Run `python3 scripts/build_work_pages.py` — regenerates `work.html` and all `work/[slug].html` pages

Or, manually edit `img/projects/manifest.json` and re-run `build_work_pages.py`.

## Design tokens (in `assets/styles.css` `:root`)

- **Palette:** `--paper #FFFFFF`, `--paper-warm #FAFAFA`, `--ink #000000`, `--ink-mid #3A3A3A`, `--ink-mute #777777`
- **Type:** `--display 'Saira'` (geometric sans, bold for ALL CAPS headlines), `--sans 'Inter'` (body), `--mono 'JetBrains Mono'` (eyebrows + labels)
- **Spacing:** `--x1` to `--x10` (.5rem → 13rem)
- **Layout:** `--rail max(2rem, 4vw)`, `--max 1480px`

## Key conventions

- **White base everywhere.** Cream tint (`--paper-warm`) only for alternating section breaks.
- **No italic emphasis.** The new typography system uses weight + caps for emphasis, not `<em>`. Old pages may still have `<em>` — strip on revisit.
- **Numbered eyebrows.** Every section starts with `0X — LABEL` mono caps.
- **Filterable grids.** Project tiles use `data-tags` attribute; filter chips use `data-filter`. JS in `main.js` handles toggling.
- **Mobile breakpoint at 720px.** Hamburger drawer; column stacks; smaller hero typography.

## Things still to do

- [x] **Instagram:** icon links to https://www.instagram.com/astrostation.co/ site-wide
- [ ] **Photography:** Replace hero placeholder shots on service pages with final cinematic project photography
- [ ] **CMS migration:** Webflow build (recommended) — see `Astro_Station_Developer_Handoff_Brief.pdf` in project root
- [ ] **Calendar wiring:** "Schedule a Consultation" buttons need a Cal.com / HubSpot calendar embed
- [ ] **CRM wiring:** `/contact` form needs a real endpoint (HubSpot / Pipedrive)
- [ ] **Domain cutover:** astrostation.co currently shows the placeholder splash — point to this static site or new Webflow build
- [ ] **Project metadata:** Many projects are Concept/Render only; add real Status, Year, Location, Client when available
- [ ] **Mattone 150 + Core Sans A:** Once licensed for web, swap `--display` and `--sans` CSS variables (single change in `styles.css`)

## Project root deliverables

Stored at `/Users/eucorrea/Documents/Claude/Projects/Astro Station - AAG 2026/`:
- `Astro_Station_Website_Audit_Report.pdf` — full audit + fix log
- `Astro_Station_Developer_Handoff_Brief.pdf` — vendor brief for Webflow developer
- `Astro_Built_Website_Concept.pdf` — strategy doc for the Construction page
- `Astro_Built_Website_Template.html` — earlier dark-base prototype (superseded by `services/built.html`)

## Tooling scripts

In `scripts/`:
- `process_projects.py` — converts `PROYECTOS ASTRO/` photo folders into web-ready `img/projects/[slug]/`
- `build_work_pages.py` — generates `work.html` + `work/[slug].html` from `img/projects/manifest.json`
- `propagate_chrome.py` — applies the shared nav/footer to every page if the chrome is updated

Run from the website root: `python3 scripts/[name].py`
