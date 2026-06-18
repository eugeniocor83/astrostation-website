# Astro Station — Brand Assets Manifest

Drop-in slots for official brand artwork. The current files in this folder are vector
approximations built from the brand reference. To bring the site to production fidelity,
replace each file below with the official artwork — keep the **exact filename** and
the markup will pick it up automatically.

## Files in this folder

| File                  | Status        | What it is                                     | Where it appears                                          |
|-----------------------|---------------|------------------------------------------------|-----------------------------------------------------------|
| `wordmark.svg`        | PLACEHOLDER   | The "astro · STATION" logotype                 | Slide 01 (homepage hero)                                  |
| `asterisk.svg`        | PLACEHOLDER   | The 6-stroke radial mark                       | Nav (every page), Slide 06, Slide 09 universe center      |
| `whitebox.svg`        | PLACEHOLDER   | The WHITE BOX product visual (3D box)          | Slide 08                                                  |
| `cosmonaut.svg`       | PLACEHOLDER   | The chrome falling cosmonaut                   | Slide 10                                                  |
| `aerial.jpg`          | OK            | Photography (used elsewhere)                   | Hero backgrounds                                          |
| `living.jpg`, etc.    | OK            | Project photography                            | Various                                                   |

## Replacement guide

### 1. Official wordmark
Save as `wordmark.svg` in this folder. Recommended viewBox 800×220 (or any aspect; the
markup uses `width` to size). All references in the site are:
```html
<img src="img/brand/wordmark.svg" alt="Astro Station" />
```
or `../img/brand/wordmark.svg` from /services/ pages.

### 2. Official asterisk mark
Save as `asterisk.svg` in this folder. Recommended viewBox 200×200, square. Used as:
```html
<img src="img/brand/asterisk.svg" alt="" class="asterisk-mark" />
```
The CSS in `assets/styles.css` controls sizing per location:
- Nav: 32px
- Slide 06 (Outside the Box): 54px
- Slide 09 (Universe center): 120px

### 3. WHITE BOX product photograph
Two options:

**A. PNG/JPG photograph (recommended for fidelity):**
Save as `whitebox.png` (or `.jpg`) in this folder. Then in `index.html` change:
```html
<img class="whitebox__img" src="img/brand/whitebox.svg" .../>
```
to:
```html
<img class="whitebox__img" src="img/brand/whitebox.png" .../>
```

**B. SVG (if a vector version exists):**
Just replace `whitebox.svg` directly — no markup change needed.

### 4. Chrome cosmonaut
Same pattern. Save the chrome render at `cosmonaut.png` (or `.jpg`) and update:
```html
<img src="img/brand/cosmonaut.svg" .../>
```
to:
```html
<img src="img/brand/cosmonaut.png" .../>
```
in `index.html` (Slide 10).

## Notes on the placeholder vectors

The placeholder SVGs were built to closely match the brand reference but are
approximations — they capture the structure and gesture of the marks but cannot
reproduce custom-drawn details (calligraphic stroke variation, painted texture, etc.)
that the official artwork carries. Always prefer the official files for production.

If the official files come in raster only (PNG/JPG), consider asking your brand
designer to deliver SVG versions of the wordmark and asterisk specifically — they
will scale crisply at every size on the site.
