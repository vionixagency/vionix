# VIONIX — Galactic Visual Growth Website

This build is intentionally visual-first. Shared CSS/JS powers all pages.

## Image replacement system

The folder `assets/images/slots/` contains replaceable demo images.
There are 72 prepared slots; the first 68 are used throughout the current page set.
Replace a file with your final image using the **exact same filename** and the website will display it without a code change.

Recommended image sizes:
- Hero / wide visual: 1600×900 or larger
- Standard visual: 1200×760 or larger
- Use WebP for performance when possible.

## Code organization

- `index.html` — homepage
- `css/style.css` — shared visual system and layout
- `js/main.js` — shared interaction and animation engine
- `assets/images/slots/` — replaceable image assets
- `services/` — service pages
- `blog/` — blog pages

The code is intentionally formatted in readable, multi-line blocks so future edits are easier.
