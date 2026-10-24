# Image provenance

Policy (DESIGN.md v2): real imagery only. No stock, no AI-generated food, no photos of children.

Every image here comes from Southern Food Basket's own public Instagram posts, which Gregg downloaded and
supplied on 2026-10-23 (folder `Downloads/Food Basket`, 58 photos and 2 videos). They are **third-party media**:
the company owns them. They are used in this unofficial concept to show the business its own brand; there is no
permission recorded to publish them. Do not show this concept publicly (trinovata.com/work, social) without that
permission.

Processing: cropped and resized with ffmpeg to 800 px wide WebP (quality 80). Product crops remove the company's
baked-in logo, "NEW PRODUCT" corner and "1 FOR $x · TRY ME" badge; the site re-renders prices as live text from
`data/seed.js`. Post dates come from the Unix timestamp in each downloaded file name.

## Brand

| File | What | From |
|---|---|---|
| `sfb-logo.svg` | The logo as vector paths (five inks: white outline, pink #E73F78, orange #ED6536, brown #542D1A, green #2C8A4F). Traced on 2026-10-23 from the 861 px cut-out below with a colour-clustering contour tracer (scratch script, not in the repo); letterforms and cornucopia are the company's own artwork | Cut-out of the post of 4 Oct 2026 (file `…1791128009_4000593303757597256…`) |
| `sfb-mark.svg` | The same vector logo clipped to the cornucopia; portal sidebar and payslip | Same trace |
| `favicon-64.png`, `apple-touch-icon.png` | The cornucopia mark rendered at 64 and 180 px | Same trace |
| `sfb-logo.webp`, `sfb-mark.png` | The earlier raster cut-out (386×176) kept as a fallback | Same post |

The company's current Facebook profile picture is a Divali edition of a stacked logo (deep crimson "Southern", green "food basket", diyas, crimson-and-green ring), read from the public page on 2026-10-23. It is not used on the site because it is seasonal.

## Storefront glass (`glass/`)

Drawn in code by Trinovata on 2026-10-23 (scratch generator) from photos of the stores' exteriors that Gregg sent in chat: `fanlight.svg` (gold sunburst half-arch with a teal hub, after the arched windows), `glass-grid.svg` (gold and teal reflective panes, after the Couva gable atrium), `facade-band.svg` (white band with the pink-and-green zigzag over green glass with gold arch and gable inlays, after the Market Place store), `zigzag.svg`. No photo pixels are used.

## Photos (`photos/`)

| File | Post date | Notes |
|---|---|---|
| `store-produce.webp` | 1 Oct 2026 | Fruits and vegetables section, cropped clear of staff and customers |
| `flags-car.webp` | 4 Oct 2026 | Company flags flying from a vehicle; no faces |
| `team-flags.webp` | 4 Oct 2026 | Staff in red company shirts holding flags (adults, company promotional photo) |
| `veg-chunky.webp`, `veg-stir-fry.webp`, `veg-chow-mein.webp`, `parsley.webp` | 8 Oct 2026 | Tagged Couva |
| `cake-red-velvet.webp`, `cake-chocolate.webp`, `cake-sponge.webp`, `cake-coconut.webp`, `cake-almond-crumble.webp` | 9 Sep 2026 | Tagged Couva |
| `protein-chips.webp`, `protein-crunch.webp` | 14 Sep 2026 | Marked new; tagged Couva |
| `st-ives.webp`, `dove.webp`, `tone.webp`, `old-spice.webp`, `irish-spring.webp` | 8 Sep 2026 | |
| `ripples.webp`, `mr-brownie.webp`, `coconut-popcorn.webp` | 7 Oct 2026 | |
| `snacks-basket.webp` | 7 Oct 2026 | Basket of snacks; no price badge in the original |
| `chobani-creations.webp`, `chobani-flip.webp`, `gogurt.webp`, `snack-pack.webp` | 8 Jul 2026 | |
| `chee-zees.webp` | 15 Jul 2026 | Marked new |
| `lays-limited.webp` | 12 Jun 2026 | Marked new and limited edition |

Not used: the in-store prize-giving photos (they show identifiable customers and children), the glass-mug
graphic (a designed advert, not a photo), and the two videos.
