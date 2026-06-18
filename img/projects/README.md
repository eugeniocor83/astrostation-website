# Astro Station — Projects upload folder

Drop new projects here, one folder per project.

## Folder naming
Use lower-case, hyphenated slugs:
- casa-coral
- bay-house-coral-gables
- pinecrest-pavilion
- key-biscayne-estate
- residence-17-brickell

## Files inside each project folder

| File              | Required | Spec                                                |
|-------------------|----------|-----------------------------------------------------|
| hero.jpg          | yes      | Main image, 16:9 landscape, ≥ 2400px wide          |
| card.jpg          | yes      | Grid thumbnail, 4:5 portrait crop, ≥ 1200px wide   |
| 01.jpg ... NN.jpg | yes      | 6–12 gallery images, any orientation                |
| info.txt          | optional | Project metadata (otherwise paste in chat)          |

## info.txt template (or paste in chat)

```
NAME: Casa Coral
NEIGHBORHOOD: Coconut Grove, FL
YEAR: 2025
SERVICE TAGS: architecture, built
LED BY: David Castrillón, José Martínez
STATUS: Built
SUMMARY: One sentence about the project.
PUBLISH NAME: Yes
```

## How a project ends up on the site

1. Drop the folder + photos here
2. Paste the metadata in chat (or save info.txt in the folder)
3. The project shows up on:
   - /work — main portfolio grid (filterable)
   - /work/[slug].html — full detail page with gallery
   - /index — homepage Selected Work section (if Featured = yes)
   - /services/[matching-service].html — service page filtered grid
