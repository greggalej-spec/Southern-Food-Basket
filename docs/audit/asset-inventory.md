# Asset inventory: Southern Food Basket concept site

S0 audit file 4 of 5. Written 2026-10-28 for PRD section 27.1 (`docs/prd/SFB-PRD-001.md:1156`). Branch `concept-v1`, HEAD `aa5a7f8`.

## 0. How to read this

- Sizes come from `cmd: find assets/img options/shots -type f -printf '%s %p\n'`. Pixel sizes come from the file headers (a small Python script read the WebP and PNG headers; SVG sizes are from the `width` and `height` attributes).
- "Shows" is taken from the `alt` text and names in `data/seed.js` and from notes in `assets/img/SOURCES.md`. The image files themselves were not opened in this audit. Treat the "shows" column as the repo's own description, not a visual check.
- Source and rights come from `assets/img/SOURCES.md` (cited as `SOURCES.md:line`), `CLAUDE.md:3-5` and `SITE.md`. Nothing outside the repo was checked: no permission email, licence or client approval record was found.
- "Used by" comes from `grep` over `*.html`, `*.js` and `*.css` (excluding `docs/`, `.git/`).
- Counts: `assets/img` holds 41 files, 1,862,773 bytes (`cmd: find assets/img -type f`). Of those, 29 are photos (1,586,868 bytes), 4 are glass SVGs (9,650 bytes) and 1 is `SOURCES.md`. `options/shots/` holds 4 more files, 610,974 bytes.

## 1. Rights status in one place

| Asset group | Where it came from | Rights status | Evidence |
|---|---|---|---|
| Logo (`sfb-logo.svg`, `sfb-mark.svg`, icons, raster fallbacks) | Traced on 2026-10-23 from a cut-out of the company's 4 Oct 2026 Instagram post. The tracer script is not in the repo. | The company's artwork. No permission recorded. A licence is needed before any official launch. | `SOURCES.md:5-9, 19-22, 24`; `CLAUDE.md:3-4` |
| 29 photos in `assets/img/photos/` | The company's public Instagram posts, downloaded by Gregg on 2026-10-23 (folder "Downloads/Food Basket", 58 photos and 2 videos). | Third-party media. "No permission recorded to publish them." A licence is needed before any official launch. | `SOURCES.md:5-9` |
| Prices on the specials | Taken from the same Instagram posts and typed into `data/seed.js` as text. | Company data taken from its public posts. No permission recorded; accuracy unverified (see risk-register.md R-05). | `data/seed.js:3-5, 75-77`; `SOURCES.md:12-13` |
| Glass SVGs in `assets/img/glass/` | Drawn in code by Trinovata from exterior photos Gregg sent in chat. No photo pixels are used. | Trinovata work. The shapes follow the company's storefronts; whether the company needs to approve that was not recorded. | `SOURCES.md:28` |
| `trinovata-mark-ondark.png` | Trinovata's own mark. | Trinovata asset. The brand package was not opened in this audit. | `assets/options-nav/options-nav.js:78` |
| `options/shots/*.webp` | Screenshots of the concept pages (they carry the logo, photos and prices). | Same status as the assets they show. | `options/index.html:154` |
| Fonts | Google Fonts, loaded from Google at runtime. | Open licences are published by Google Fonts; not verified in this audit. | integrations.md section 4.1 |

`SOURCES.md:7-9` states the rule in the repo's own words: do not show the concept publicly (trinovata.com/work, social) without the company's permission. `SITE.md:10` records that the Vercel alias stays public so Gregg can share it with the business only.

Not found anywhere in the repo: a licence, a permission message, photographer names, shoot dates, model releases, or a log of who approved which asset. PRD questions Q3 (brand kit) and Q5 (hero and photo rights) are open.

## 2. Brand and icon files

| File | Bytes | Pixels | Shows | Source and rights | Used by |
|---|---|---|---|---|---|
| `assets/img/sfb-logo.svg` | 77,984 | 861 x 393 | Full logo as vector paths, five inks (white outline, pink, orange, brown, green) | Traced 2026-10-23 from the 4 Oct 2026 post cut-out (`SOURCES.md:19`). No permission recorded. | Every inner page header and footer via `assets/js/ui.js:10`; home header and footer (`index.html`, template); `options/index.html`; options A, B and C; the admin post canvas (`assets/js/admin.js:469`) |
| `assets/img/sfb-logo.webp` | 22,562 | 386 x 176 | Earlier raster cut-out of the logo, kept as a fallback | Same post (`SOURCES.md:22`) | Admin canvas fallback only (`assets/js/admin.js:468`) |
| `assets/img/sfb-mark.svg` | 78,074 | viewBox -52 0 393 393 | The cornucopia part of the logo | Same trace (`SOURCES.md:20`) | Portal sidebar and payslip via `assets/js/ui.js:11` |
| `assets/img/sfb-mark.png` | 56,625 | 192 x 192 | Raster mark | Same post (`SOURCES.md:22`) | Not found. `cmd: grep -rn "sfb-mark.png"` over html, js, css and json found no reference. |
| `assets/img/favicon-64.png` | 5,366 | 64 x 64 | Cornucopia mark | Same trace (`SOURCES.md:21`) | 24 of 25 HTML files reference the icons; `_capture.html` does not (`cmd: grep -rLE favicon-64 --include=*.html`) |
| `assets/img/apple-touch-icon.png` | 18,096 | 180 x 180 | Cornucopia mark | Same trace (`SOURCES.md:21`) | Same pages |
| `assets/img/trinovata-mark-ondark.png` | 3,715 | 75 x 64 | Trinovata mark for dark backgrounds | Trinovata | `assets/options-nav/options-nav.js:78` (options pages) |

Logo notes:

- The tracer is a "scratch script, not in the repo" (`SOURCES.md:19`). The logo cannot be regenerated from the repo.
- The company's current Facebook profile picture is a seasonal Divali logo. It is not used (`SOURCES.md:24`). Which logo the company treats as current was not recorded (PRD Q3).
- The admin Post maker draws the logo and a photo onto a canvas to make a social-media image (`assets/js/admin.js:468-469, 692`).

## 3. Glass motifs (drawn by Trinovata)

| File | Bytes | Shows | Used by |
|---|---|---|---|
| `assets/img/glass/fanlight.svg` | 3,472 | Gold sunburst half-arch with teal hub | `assets/css/grand-entrance.css:114, 169, 184`; `assets/css/tokens.css:134, 141` |
| `assets/img/glass/glass-grid.svg` | 2,906 | Gold and teal reflective panes | `assets/css/grand-entrance.css:161`; `assets/css/site.css:95`; `assets/css/tokens.css:144` |
| `assets/img/glass/facade-band.svg` | 2,881 | White band with a pink and green zigzag over green glass | `assets/css/grand-entrance.css:163`; `assets/css/tokens.css:133`; `options/a/index.html:221` |
| `assets/img/glass/zigzag.svg` | 391 | Pink and green zigzag strip | `assets/css/tokens.css:132`; `assets/css/site.css:103`; `options/a/index.html:218` |

Descriptions are from `SOURCES.md:28`. Source: exterior photos Gregg sent in chat; those chat photos are not in the repo.

## 4. Photos (`assets/img/photos/`, 29 files, all WebP, 800 px wide)

Source of every photo below: the company's public Instagram, downloaded 2026-10-23 (`SOURCES.md:5-9`). Rights: no permission recorded. Crops remove the company's logo, "NEW PRODUCT" corner and price badge (`SOURCES.md:12-13`).

Photographer: not found for any file. Shoot date: not found; only the Instagram post date is known (`SOURCES.md:34-45`).

Key for the "Used by" column:

- SP = specials page card (`assets/js/site.js:25`) and the admin photo library, specials table, preview and post maker (`assets/js/admin.js:35, 174, 246, 692`). Every file that is the `img` of a special is in SP.
- SH = home page deals shelf. The shelf shows the 12 newest specials by `posted` date (`assets/js/grand-entrance.js:127-128`). The comparator returns -1 on ties, so which three of the five 9 Sep cakes appear is undefined.
- DEPT = department image (`data/seed.js:59-71`), shown on `departments.html` (`assets/js/site.js:191`) and in the home aisle grid except wholesale (`assets/js/grand-entrance.js:135`). `assets/js/site.js:92-96` also builds department tiles into a `[data-dept-grid]` element, but `cmd: grep -rln "data-dept-grid" --include=*.html .` returned no file, so that path renders nothing today.
- Options A, B and C build special cards from `SFB_DATA.specials` (`options/a/index.html:616`; `options/b/index.html:675`; `options/c/index.html:774, 828`). Which specials each option shows was not traced, so those uses are not listed per file. Direct references are listed.

| File | Bytes | Pixels | Shows (per seed alt and notes) | Post date | Used by |
|---|---|---|---|---|---|
| `cake-almond-crumble.webp` | 43,998 | 800 x 584 | Almond crumble cake, 7-inch double layer | 9 Sep 2026 | SP; SH if among the 3 cakes chosen |
| `cake-chocolate.webp` | 32,682 | 800 x 584 | Chocolate cake, 9-inch double layer | 9 Sep 2026 | SP; SH if chosen; `options/c/index.html:530` |
| `cake-coconut.webp` | 22,826 | 800 x 584 | Coconut cake, 7-inch double layer | 9 Sep 2026 | SP; SH if chosen |
| `cake-red-velvet.webp` | 50,396 | 800 x 584 | Red velvet cake, 9-inch, in a clear box | 9 Sep 2026 | SP; SH if chosen; DEPT (bakery, `data/seed.js:61`); `options/c/index.html:572` |
| `cake-sponge.webp` | 39,122 | 800 x 584 | Sponge cake with blue piped border | 9 Sep 2026 | SP; SH if chosen; `options/c/index.html:837` |
| `chee-zees.webp` | 57,434 | 800 x 666 | Bag of Chee Zees, kick of spice | 15 Jul 2026 | SP |
| `chobani-creations.webp` | 23,818 | 800 x 666 | Cup of Chobani Creations caramel sundae yogurt | 8 Jul 2026 | SP |
| `chobani-flip.webp` | 69,106 | 800 x 666 | Chobani Flip almond coco loco cups on a chilled shelf | 8 Jul 2026 | SP; DEPT (chilled, `data/seed.js:63`) |
| `coconut-popcorn.webp` | 43,080 | 800 x 666 | Bag of Coconut Crunch popcorn | 7 Oct 2026 | SP; SH |
| `dove.webp` | 23,322 | 800 x 666 | White bottle of Dove glowing body wash | 8 Sep 2026 | SP |
| `flags-car.webp` | 39,184 | 800 x 600 | Company flags flying from a vehicle; no faces | 4 Oct 2026 | `data/seed.js:428` (`content.community`), displayed only by `options/c/index.html:645` |
| `gogurt.webp` | 62,144 | 800 x 666 | Box of Go-Gurt tubes, Spider-Man packaging | 8 Jul 2026 | SP |
| `irish-spring.webp` | 27,598 | 800 x 666 | Green bottle of Irish Spring aloe mist body wash | 8 Sep 2026 | SP |
| `lays-limited.webp` | 46,272 | 800 x 666 | Limited-edition Lay's chips bag | 12 Jun 2026 | SP |
| `mr-brownie.webp` | 60,172 | 800 x 666 | Two packs of Mr. Brownie brownies on a shelf hook | 7 Oct 2026 | SP; SH |
| `old-spice.webp` | 32,348 | 800 x 666 | Red bottle of Old Spice Captain body wash | 8 Sep 2026 | SP |
| `parsley.webp` | 123,610 | 800 x 584 | Wrapped tray of fresh curly parsley | 8 Oct 2026 | SP; SH |
| `protein-chips.webp` | 56,844 | 800 x 666 | Applied Nutrition protein chips bag, sour cream and onion | 14 Sep 2026 | SP; SH; DEPT (health, `data/seed.js:67`) |
| `protein-crunch.webp` | 66,254 | 800 x 666 | Two Protein Crunch bars in a hand | 14 Sep 2026 | SP; SH; `options/a/index.html:629` |
| `ripples.webp` | 61,448 | 800 x 666 | Bag of Ripples potato chips | 7 Oct 2026 | SP; SH |
| `snack-pack.webp` | 79,284 | 800 x 666 | Four-pack of Snack Pack pudding cups | 8 Jul 2026 | SP |
| `snacks-basket.webp` | 53,890 | 800 x 600 | Shopping basket of chips, brownies and popcorn; no price badge in the original | 7 Oct 2026 | DEPT (snacks, `data/seed.js:65`) |
| `st-ives.webp` | 33,304 | 800 x 666 | Bottle of St. Ives citrus and cherry blossom body wash, 650 ml | 8 Sep 2026 | SP; DEPT (care, `data/seed.js:69`) |
| `store-produce.webp` | 65,236 | 800 x 640 | Fruits and vegetables section of a store; alt text says plantain is priced at $8.95; cropped clear of staff and customers | 1 Oct 2026 | DEPT (wholesale, `data/seed.js:71`; not shown in the home aisle grid); `wholesale.html:29`; `options/a/index.html:628`; `options/b/index.html:541`; `options/c/index.html:515, 836` |
| `team-flags.webp` | 82,476 | 800 x 600 | Staff in red company shirts holding the company's pink and green flags (adults, company promotional photo) | 4 Oct 2026 | Home careers band (`index.html:117`, template line 103); `about.html:26`; `options/a/index.html:456`; `options/b/index.html:560`; `options/c/index.html:677` |
| `tone.webp` | 34,166 | 800 x 666 | Green bottle of Tone Miami glow up body wash | 8 Sep 2026 | SP |
| `veg-chow-mein.webp` | 90,222 | 800 x 584 | Tray of shredded carrot, cabbage and peppers for chow mein | 8 Oct 2026 | SP; SH |
| `veg-chunky.webp` | 75,308 | 800 x 584 | Tray of chunky cut vegetables | 8 Oct 2026 | SP; SH; DEPT (fresh, `data/seed.js:59`) |
| `veg-stir-fry.webp` | 91,324 | 800 x 584 | Tray of broccoli, carrot sticks, celery and peppers | 8 Oct 2026 | SP; SH; `options/c/index.html:535` |

Check: 29 rows above; `cmd: find assets/img/photos -type f | wc -l` returns 29 (sizes listed with `find ... -printf`).

The 25 specials use 25 distinct photos (`data/seed.js:79-103`). The other four photos (`flags-car`, `snacks-basket`, `store-produce`, `team-flags`) are used for departments, the community block, the wholesale page and the careers band.

Observations on the photos:

- Many photos show other companies' packaged brands (Chobani, Dove, Old Spice, Lay's, Go-Gurt, St. Ives, Applied Nutrition and others, per the seed names). The repo records no check of those brands' terms.
- `team-flags.webp` shows staff (adults). No model release or consent record was found. `SOURCES.md:36` says only "company promotional photo".
- `SOURCES.md:47-48` lists material that was left out on purpose: prize-giving photos (identifiable customers and children), a glass-mug advert graphic, and the two videos. The repo's policy line is "No photos of children" (`SOURCES.md:3`).
- Photos in specials are from June to October 2026 and carry price data from the same posts. The oldest, `lays-limited.webp`, is dated 12 Jun 2026 (`data/seed.js:96`). The specials have no end date (see current-state.md and risk-register.md R-05).

## 5. Gap against the PRD photo brief (PRD 15.2)

`SFB-PRD-001.md:648-676` lists a 25-shot brief. It includes five branch exteriors. The repo holds:

| PRD need | In the repo |
|---|---|
| Five branch exteriors (one per branch) | None. `cmd: ls assets/img/photos` shows no exterior photo of any store. The glass SVGs were drawn from exteriors Gregg sent in chat, and those photos are not in the repo. |
| Hero imagery | The home page scene is an SVG drawing of the Couva store front, generated by `tools/grand-entrance/make-scene.js` (`:1-2`) and inlined into `index.html` by `tools/grand-entrance/build.js:5-10`. It is not a photograph and is not in `assets/img`. |
| Rights, photographer and shoot-date fields | None. Only the Instagram post date is recorded. |
| Alt text | Present for all 25 specials and 7 departments in `data/seed.js` (the `alt` fields). Alt text for `store-produce` repeats a shelf price. |
| Image formats | WebP at 800 px wide. No larger originals and no AVIF file in the listing. `cmd: grep -rn "srcset" --include=*.html --include=*.js .` (outside `docs/`, `.git/`) returned no match, so every image is one size. |

## 6. Screenshots in `options/shots/`

| File | Bytes | Pixels | Used by |
|---|---|---|---|
| `options/shots/option-a.webp` | 164,046 | 1280 x 1600 | `options/index.html:154` (chooser card for option A) |
| `options/shots/option-b.webp` | 189,858 | 1280 x 1600 | same |
| `options/shots/option-c.webp` | 174,456 | 1280 x 1600 | same |
| `options/shots/option-d.webp` | 82,614 | 1280 x 1600 | same; "d" is the main Grand Entrance design (`options/index.html:144`) |

These are screenshots of the concept pages. They are public on the live site (route-map.md section 1: `options/shots/option-a.webp` returns 200).

## 7. Fonts

No font file is stored in the repo. `cmd: find . -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.otf"` outside `.git` returned nothing, and `grep -rn "@font-face"` found no rule. All fonts load from Google Fonts at runtime. Detail and page lists are in integrations.md section 4.1.

| Family | Weights | Role | Evidence |
|---|---|---|---|
| Caprasimo | one | `--display`, headings | `assets/css/tokens.css:23` |
| Atkinson Hyperlegible Next | 400, 600, 700, 800 | `--ui`, body text | `assets/css/tokens.css:24` |
| Alfa Slab One | one | `--price` and `--slab`, prices | `assets/css/tokens.css:25`; `assets/css/grand-entrance.css:10` |
| Besley | 700, 800, 900 | Option A only | `options/a/index.html:12` |
| Yellowtail | one | Option A only | `options/a/index.html:12` |
| Archivo | width 62-125, weight 500-900 | Option B only | `options/b/index.html:12` |
| Shrikhand | one | Option C only | `options/c/index.html:12` |

The company's own brand fonts: not found (PRD Q3 open). The repo's design law is `DESIGN.md` (`CLAUDE.md:8`); it was not read in this audit.
