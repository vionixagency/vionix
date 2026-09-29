# Vionix — Galactic Growth Experience

This build is the visual/interaction redesign of the Vionix agency site.

## Key changes
- Deep-space Galactic visual system: navy, electric blue, cyan/aqua, violet, rare gold.
- Full-width layout with a maximum 18px side gutter.
- Persistent readable header/navigation and responsive mobile navigation.
- Shared Canvas 2D animation engine in `js/main.js`.
- Neural particle network, coded planet/globe, orbiting satellite, growth rocket/chart, sales funnel, chaos-to-order, magnetic cursor and 3D card tilt.
- Home growth intelligence control room with an illustrative growth trajectory and interactive sales funnel.
- All social platforms use inline SVG logo buttons in the footer; no visible platform-name labels in the social row.
- No raster/video graphics are included.
- Existing URLs, SEO metadata and editorial content are preserved.

## Animation / accessibility controls
- Heavy visual scenes are deferred until after the page is visible.
- Animation pause control persists in localStorage.
- `prefers-reduced-motion` disables loops and cursor effects.
- Canvas visuals are decorative/interactive; important text remains HTML.

## Important note
The globe, rocket and charts are intentionally dependency-free Canvas 2D implementations rather than an external Three.js bundle. This keeps the GitHub Pages build self-contained while still providing coded 3D-style visual depth and interaction.

## Main changed files
- `index.html` — hero and business-growth visualization panels; fixed header markup.
- `css/style.css` — complete Galactic visual system, full-width layout, responsive UI, buttons, surfaces, social icon styling and accessibility states.
- `js/main.js` — shared animation engine, coded globe/rocket/funnel/growth visuals, interactions, magnetic cursor, tilt, pause/reduced-motion handling.
- `work/index.html` and other HTML files — old light/royal-blue SVG artwork colors normalized to the Galactic palette and footer social row retained as SVG icons.
