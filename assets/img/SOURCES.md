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
| `sfb-logo.webp` | The cornucopia logo with the "Southern food basket" wordmark, cut out of a photo with a flood-fill script (white sticker outline kept), 386×176 | Post of 4 Oct 2026 (file `…1791128009_4000593303757597256…`) |
| `sfb-mark.png` | Cornucopia only, transparent, 192×192; used in the portal sidebar and payslip | Same cut-out |
| `favicon-64.png` | Cornucopia at 64×64 | Same cut-out |

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
