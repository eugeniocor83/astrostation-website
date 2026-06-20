"""
Build the Work index page + per-project detail pages from the project manifest.

Editorial rebuild — surfaces location, status, editorial copy, and a curated
"Drawings" section with architectural plans, sections, elevations and
volumetric studies for each project.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "img" / "projects" / "manifest.json"

with open(MANIFEST) as f:
    projects = json.load(f)

# ─────────────────────────────────────────────────────────────
# Shared chrome (nav + footer)
# ─────────────────────────────────────────────────────────────
def nav_block(active="", depth=0):
    p = "../" * depth
    return f'''<nav class="nav">
  <a class="nav__brand" href="{p}index.html">
    <img src="{p}img/brand/wordmark.png" alt="Astro Station" class="nav__logo">
  </a>
  <div class="nav__menu">
    <a href="{p}studio.html"{' class="active"' if active=='studio' else ''}>Studio</a>
    <a href="{p}work.html"{' class="active"' if active=='work' else ''}>Work</a>
    <div class="has-sub">
      <a href="{p}services.html"{' class="active"' if active.startswith('services') else ''}>Services <span style="opacity:.5">+</span></a>
      <div class="nav__sub">
        <a href="{p}services/architecture.html"><span>01 — Architecture</span><span class="num">01</span></a>
        <a href="{p}services/interiors.html"><span>02 — Interior Design</span><span class="num">02</span></a>
        <a href="{p}services/millwork.html"><span>03 — Millwork · Dragon</span><span class="num">03</span></a>
        <a href="{p}services/built.html" class="is-built"><span>04 — Construction · Astro Cósmico</span><span class="num">04</span></a>
        <a href="{p}services/landscape.html"><span>05 — Landscape &amp; Pool</span><span class="num">05</span></a>
        <a href="{p}services/exterior.html"><span>06 — Exterior Re-facing</span><span class="num">06</span></a>
        <a href="{p}services/rendering.html"><span>07 — Rendering</span><span class="num">07</span></a>
      </div>
    </div>
    <a href="{p}journal.html"{' class="active"' if active=='journal' else ''}>Journal</a>
    <a href="{p}contact.html"{' class="active"' if active=='contact' else ''}>Contact</a>
  </div>
  <div class="nav__util">
    <span class="nav__clock" id="clock">Miami · 00:00:00</span>
    <a class="btn" href="{p}contact.html">Start the Process <span class="arr">→</span></a>
    <button class="nav__hamburger" aria-label="Menu" onclick="document.querySelector('.nav').classList.toggle('open')"><span></span><span></span><span></span></button>
  </div>
</nav>'''

def footer_block(depth=0):
    p = "../" * depth
    return f'''<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__brand">
        <img src="{p}img/brand/wordmark.png" alt="Astro Station" style="height:36px;width:auto;display:block;margin-bottom:.6rem">
        <div class="desc">Architecture · Interiors · Millwork · Built</div>
        <p>A creative station of architecture and interior design. Bespoke luxury homes — designed and delivered as one, by a team of cosmonauts based in Miami.</p>
      </div>
      <div class="foot__col">
        <h6>Studio</h6>
        <a href="{p}studio.html">About</a>
        <a href="{p}studio.html#team">Team</a>
        <a href="{p}journal.html">Journal</a>
        <a href="{p}studio.html#careers">Careers</a>
      </div>
      <div class="foot__col">
        <h6>Universe</h6>
        <a href="{p}services/architecture.html">Architecture</a>
        <a href="{p}services/interiors.html">Interiors</a>
        <a href="{p}services/millwork.html">Millwork · Dragon</a>
        <a href="{p}services/built.html">Astro Cósmico</a>
        <a href="{p}services/landscape.html">Landscape</a>
        <a href="{p}services/exterior.html">Exterior</a>
        <a href="{p}services/rendering.html">Rendering</a>
      </div>
      <div class="foot__col">
        <h6>Work</h6>
        <a href="{p}work.html">All Projects</a>
        <a href="{p}work.html#residential">Residential</a>
        <a href="{p}work.html#hospitality">Hospitality</a>
      </div>
      <div class="foot__col">
        <h6>Contact</h6>
        <a href="tel:+17869091565">+1 786 909 1565</a>
        <a href="mailto:info@astrostation.co">info@astrostation.co</a>
        <a href="https://instagram.com/astrostation">Instagram</a>
        <a href="https://linkedin.com/company/astrostation">LinkedIn</a>
      </div>
    </div>
    <div class="foot__bottom">
      <span>© Astro Station 2026 · All rights reserved · Privacy</span>
      <span>Miami · Los Angeles</span>
    </div>
  </div>
</footer>
<script src="{p}assets/main.js?v=20260620e"></script>'''


# ─────────────────────────────────────────────────────────────
# Editorial card sizing — varied rhythm by index in group
# ─────────────────────────────────────────────────────────────
# Featured row: 1 large + 2 medium then alternating
FEATURED_SIZES = ["large", "medium", "medium", "large", "medium", "regular", "regular"]
RESIDENTIAL_SIZES = ["large", "medium", "regular", "regular", "medium", "large", "medium", "regular"]
HOSPITALITY_SIZES = ["large", "medium", "medium", "regular", "regular", "medium", "large"]


def card_html(p, size, depth=0):
    base = "../" * depth
    img = f"{base}img/projects/{p['slug']}/card.jpg" if p["has_card"] else f"{base}img/projects/{p['slug']}/01.jpg"
    return f'''      <a class="proj {size}" href="{base}work/{p['slug']}.html" data-tags="{p['kind']} {p['tags']}{' featured' if p['featured'] else ''}">
        <img src="{img}" alt="{p['name']}" loading="lazy">
        <div class="proj__cap">
          <span class="name">{p['name']}</span>
          <span class="geo"></span>
        </div>
      </a>'''


# ─────────────────────────────────────────────────────────────
# WORK INDEX PAGE
# ─────────────────────────────────────────────────────────────
residential = [p for p in projects if p["kind"] == "residential"]
hospitality = [p for p in projects if p["kind"] == "hospitality"]

# Featured projects ride at the top
featured_residential = [p for p in residential if p["featured"]]
rest_residential = [p for p in residential if not p["featured"]]
featured_hospitality = [p for p in hospitality if p["featured"]]
rest_hospitality = [p for p in hospitality if not p["featured"]]

def render_group(group, sizes):
    return "\n".join(card_html(p, sizes[i % len(sizes)]) for i, p in enumerate(group))

featured_block = render_group(featured_residential[:5] + featured_hospitality[:2], FEATURED_SIZES)
residential_block = render_group(featured_residential + rest_residential, RESIDENTIAL_SIZES)
hospitality_block = render_group(featured_hospitality + rest_hospitality, HOSPITALITY_SIZES)

work_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Astro Station — Work</title>
<meta name="description" content="Selected work from Astro Station. Residential and hospitality projects across architecture, interior design and built work." />
<link rel="stylesheet" href="assets/styles.css?v=20260620c">
</head>
<body>
{nav_block(active='work', depth=0)}

<header class="hero hero--text">
  <div class="hero__inner">
    <div class="eyebrow">Work · Astro Station</div>
    <h1 class="hero__title">A growing archive.</h1>
    <div class="hero__foot">
      <p class="hero__sub">A measured selection from the studio — {len(projects)} works across residential and hospitality, drawn and rendered in-house. New work is added quietly, project by project.</p>
      <span class="scroll-cue"><span class="dot"></span> {len(residential)} residences · {len(hospitality)} hospitality</span>
    </div>
  </div>
</header>

<!-- ── FEATURED ───────────────────────────────────────── -->
<section class="section section--tight" id="featured">
  <div class="wrap">
    <div class="portfolio-head">
      <div>
        <div class="section-num">Featured</div>
        <h2 class="h2 serif">Selected projects.</h2>
      </div>
      <div class="filters" data-filter-group>
        <span class="active" data-filter="all">All</span>
        <span data-filter="residential">Residential</span>
        <span data-filter="hospitality">Hospitality</span>
        <span data-filter="featured">Featured</span>
      </div>
    </div>

    <div class="proj-grid" data-filter-grid>
{featured_block}
    </div>
  </div>
</section>

<!-- ── RESIDENTIAL ────────────────────────────────────── -->
<section class="section section--cream" id="residential">
  <div class="wrap">
    <div class="col-2" style="margin-bottom:var(--x5);align-items:end">
      <div>
        <div class="section-num">Residential</div>
        <h2 class="h2 serif">Houses.</h2>
      </div>
      <p class="lede">From a coral-stone Coconut Grove home to a Pompano courtyard residence — {len(residential)} houses drawn around climate, family and the slow rhythm of a Miami year. Each project is held under one principal, one drawing set, one project manager.</p>
    </div>

    <div class="proj-grid">
{residential_block}
    </div>
  </div>
</section>

<!-- ── HOSPITALITY ────────────────────────────────────── -->
<section class="section" id="hospitality">
  <div class="wrap">
    <div class="col-2" style="margin-bottom:var(--x5);align-items:end">
      <div>
        <div class="section-num">Hospitality</div>
        <h2 class="h2 serif">Restaurants &amp; lobbies.</h2>
      </div>
      <p class="lede">{len(hospitality)} restaurants and a hotel lobby, in Miami, New York and Colombia. Quiet rooms drawn for long meals — interior weather held inside warm, layered shells.</p>
    </div>

    <div class="proj-grid">
{hospitality_block}
    </div>
  </div>
</section>

<section class="closing" style="padding:var(--x10) var(--rail);text-align:center">
  <div class="section-num center" style="justify-content:center;margin-bottom:var(--x4)">A studio, not a vendor</div>
  <h2 class="display">Have a project?</h2>
  <p class="lede center" style="margin:var(--x4) auto 0;max-width:48ch">A first conversation is private and free. Bring a site, a brief, or just a question.</p>
  <div class="ctas" style="display:flex;gap:1.4rem;justify-content:center;flex-wrap:wrap;margin-top:var(--x5)">
    <a class="btn btn--solid" href="contact.html">Start the Process <span class="arr">→</span></a>
  </div>
</section>

{footer_block(depth=0)}
</body>
</html>'''

with open(ROOT / "work.html", "w") as f:
    f.write(work_html)
print(f"wrote work.html ({len(projects)} projects · {len(residential)} residential · {len(hospitality)} hospitality)")


# ─────────────────────────────────────────────────────────────
# PROJECT DETAIL PAGES (one per project)
# ─────────────────────────────────────────────────────────────
work_dir = ROOT / "work"
work_dir.mkdir(exist_ok=True)

# Editorial gallery rhythms by render count.
# Goal: leaner, more breathing room, magazine-style cadence.
GALLERY_RHYTHMS = {
    1: ["full"],
    2: ["large", "medium"],
    3: ["large", "medium", "regular"],
    4: ["large", "medium", "regular", "regular"],
    5: ["large", "medium", "regular", "regular", "medium"],
    6: ["large", "medium", "regular", "regular", "medium", "large"],
    7: ["large", "medium", "regular", "regular", "medium", "large", "medium"],
    8: ["large", "medium", "regular", "regular", "medium", "large", "regular", "regular"],
}

DRAWING_LABELS = {
    "plan-01.jpg": "Ground floor plan",
    "plan-02.jpg": "Principal elevation",
    "plan-03.jpg": "Section A",
    "plan-04.jpg": "Volumetric study",
    "plan-05.jpg": "Roof / additional plan",
    "plan-06.jpg": "Additional drawing",
}

for i, p in enumerate(projects):
    prev = projects[i - 1]
    nxt = projects[(i + 1) % len(projects)]
    kind_label = "Residence" if p["kind"] == "residential" else "Hospitality"
    tag_label = ", ".join(t.strip().title() for t in p["tags"].split(","))

    # Hero image — first render (the "money shot" by convention)
    hero = p["renders"][0] if p["renders"] else None
    rest = p["renders"][1:] if hero else []

    # Build editorial gallery rhythm
    rhythm = GALLERY_RHYTHMS.get(len(rest), GALLERY_RHYTHMS[8])
    gallery_html = []
    for idx, img in enumerate(rest):
        size = rhythm[idx % len(rhythm)]
        gallery_html.append(
            f'''      <div class="proj {size}"><img src="../img/projects/{p['slug']}/{img}" '''
            f'''alt="{p['name']} — view {idx+2}" loading="lazy"></div>'''
        )

    # Drawings section
    drawings_html = ""
    if p["plans"]:
        plan_items = []
        # Single full-width plan for first (LEVEL 1 / floor plan)
        # Then the rest in a 2-up layout
        plans = p["plans"]
        for k, plan in enumerate(plans):
            label = DRAWING_LABELS.get(plan, f"Drawing {k+1:02d}")
            plan_items.append(
                f'''        <figure class="drawing">
          <div class="drawing__frame"><img src="../img/projects/{p['slug']}/{plan}" alt="{p['name']} — {label}" loading="lazy"></div>
          <figcaption class="drawing__cap">{label}</figcaption>
        </figure>'''
            )
        drawings_html = f'''
<!-- Architecture · Drawings -->
<section class="section section--cream">
  <div class="wrap">
    <div class="col-2" style="margin-bottom:var(--x5);align-items:end">
      <div>
        <div class="section-num">Architecture</div>
        <h2 class="h2 serif">Drawings.</h2>
      </div>
      <p class="lede">Plans, elevations, sections — drawn and coordinated in-house. The drawings travel from studio to site without translation.</p>
    </div>
    <div class="drawings">
{chr(10).join(plan_items)}
    </div>
  </div>
</section>'''

    # Status pill class
    status_pill_class = " status--built" if "built" in p["status"].lower() else ""

    detail_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{p['name']} — Astro Station</title>
<meta name="description" content="{p['name']} — {p['summary']}" />
<link rel="stylesheet" href="../assets/styles.css?v=20260620c">
</head>
<body>
{nav_block(active='work', depth=1)}

<!-- ── PROJECT HERO ─────────────────────────────────── -->
<header class="proj-hero">
  <div class="proj-hero__inner wrap">
    <div class="proj-hero__crumb">
      <a href="../work.html">Work</a> <span class="sep">/</span> <span>{kind_label}</span>
    </div>
    <h1 class="proj-hero__title">{p['name']}</h1>
    <div class="proj-hero__meta">
      <span class="pill{status_pill_class}">{p['status']}</span>
      <span class="proj-hero__loc">{p['neighborhood']} · {p['city']}</span>
    </div>
  </div>
  <div class="proj-hero__bleed">
    <img src="../img/projects/{p['slug']}/{hero}" alt="{p['name']}" />
  </div>
</header>

<!-- ── BRIEF ────────────────────────────────────────── -->
<section class="section">
  <div class="wrap">
    <div class="col-2 proj-brief">
      <div>
        <div class="section-num">Project</div>
        <h2 class="h2 serif">{p['name']}</h2>
      </div>
      <div>
        <p class="lede" style="margin-bottom:var(--x4)">{p['summary']}</p>
        <div class="info-row"><span>Type</span><span>{kind_label}</span></div>
        <div class="info-row"><span>Location</span><span>{p['city']}</span></div>
        <div class="info-row"><span>Status</span><span>{p['status']}</span></div>
        <div class="info-row"><span>Scope</span><span>{tag_label}</span></div>
        <div class="info-row"><span>Studio</span><span>Astro Station</span></div>
      </div>
    </div>
  </div>
</section>

<!-- ── GALLERY ──────────────────────────────────────── -->
<section class="section">
  <div class="wrap">
    <div class="col-2" style="margin-bottom:var(--x5);align-items:end">
      <div>
        <div class="section-num">Views</div>
        <h2 class="h2 serif">Selected images.</h2>
      </div>
      <p class="lede">A curated edit. Rendered in-house. Final assets are issued at higher resolution on request.</p>
    </div>
    <div class="proj-grid">
{chr(10).join(gallery_html) if gallery_html else "      <!-- no additional renders -->"}
    </div>
  </div>
</section>
{drawings_html}

<aside class="cs-ethos">
  <div class="cs-ethos__eyebrow">Astro Station</div>
  <p class="cs-ethos__line">Architecture, interiors, millwork and construction — <strong>drawn and built under one roof</strong>, as one continuous practice.</p>
  <div class="cs-ethos__tag"><span class="cs-ethos__t1">Conceived outside the box</span> <span class="cs-ethos__dot">·</span> <span class="cs-ethos__tags">Futurist · Liquid · Melted</span></div>
</aside>

<!-- ── PREV / NEXT ──────────────────────────────────── -->
<section class="section--tight">
  <div class="wrap">
    <div class="proj-nav">
      <a class="proj-nav__side" href="{prev['slug']}.html">
        <span class="proj-nav__arr">←</span>
        <span class="proj-nav__label">Previous</span>
        <span class="proj-nav__name">{prev['name']}</span>
      </a>
      <a class="btn btn--solid" href="../contact.html">Start a project <span class="arr">→</span></a>
      <a class="proj-nav__side proj-nav__side--right" href="{nxt['slug']}.html">
        <span class="proj-nav__arr">→</span>
        <span class="proj-nav__label">Next</span>
        <span class="proj-nav__name">{nxt['name']}</span>
      </a>
    </div>
  </div>
</section>

{footer_block(depth=1)}
</body>
</html>'''

    with open(work_dir / f"{p['slug']}.html", "w") as f:
        f.write(detail_html)

print(f"wrote {len(projects)} detail pages in work/")
print("Done.")
