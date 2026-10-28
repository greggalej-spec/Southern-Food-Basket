# Southern Food Basket: photo and video shot list

Draft 1, 28 October 2026. Prepared by Trinovata Technologies for the Southern Food Basket owners and their photographer. The website is an unofficial concept; nothing here is approved until the owners say so.

---

## 1. Purpose and how to use this list

**Why it exists.** The concept website currently uses photos taken from the company's public Instagram (no permission to publish them is on record) and an animated illustration of the Couva store front standing in for drone footage. The client PRD (`docs/prd/SFB-PRD-001.md`, DEC-012 and section 15) asks for owned, bright, quality imagery. This list says exactly what to capture so that every image slot on the site can be filled with media the business owns.

**How to use it.**

| Who | Do this |
|---|---|
| Owners | Read sections 1 and 8. Name one contact per store. Answer the questions in section 8. Approve every finished image (section 6). |
| Photographer / pilot | Shoot by ID: one ID is one deliverable. Section 2 says what, how big and which shape. Section 3 is the drone job. Section 4 is the day plan. Name files by ID (section 5). |
| Trinovata | Swaps each approved image into the site, deletes the Instagram file it replaces, and ticks section 7. |

**Priority key**

| Priority | Meaning |
|---|---|
| P0 | Needed before launch. The page cannot go live without it. |
| P1 | Launch with it if possible. |
| P2 | Later. |

**At a glance:** 61 shots. P0: 30. P1: 25. P2: 6. Of the 61, 25 are the specials product series (one repeatable set-up, section 2.7).

**Rules for every shot**

1. Real only: real staff, real stock, real stores. No stock photos. No AI-generated or AI-extended images (site policy, `DESIGN.md`, Imagery).
2. True colour, legible signage, no heavy filters or HDR halos. PRD 15.3: bright natural daylight, consistent white balance.
3. Put nothing into the frame: no prices, no "NEW" stickers, no logos added, no text. The site draws prices as live text. Turn shelf-edge price tags away or pull them so no stale price is photographed (PRD 15.3: no fabricated price labels).
4. Compose for crops (PRD 15.3: safe-crop zones for 16:9, 4:5, square and narrow mobile). Keep the key subject in the middle 60% of the frame width. Where a table says "both", shoot horizontal and vertical.
5. Nobody identifiable without a signed release. No children (section 6).
6. Shoot RAW. Full resolution. The minimums below are the smallest size after cropping.

**Art direction in one paragraph.** PRD 16.3 says photography is the primary proof of business identity, and PRD 17.4 recommends the Grand Entrance as the base, with an editorial feel for About and Careers and restrained promotional energy for specials. In practice: the hero is clean, symmetrical and bright; people shots are natural and unhurried (relaxed, real, not stiff); specials are high-key with room for graphics. The PRD's creative references (section 17.1) are for editorial storytelling, hero composition and rhythm only. Do not copy their imagery or layouts.

---

## 2. Shot tables

### 2.0 Sizes and shapes: how the numbers were worked out

**Rule:** minimum pixels = 2 x the largest size the slot is ever drawn, in CSS pixels, so it stays sharp on high-density (retina and phone) screens. "Largest drawn" is read from the CSS and page widths (container maximum 1200 px; layouts change at 910 px and 980 px).

| Class | Slot shape | Largest drawn, and where it comes from | Minimum delivered |
|---|---|---|---|
| H | Full-screen hero, 16:9 | The viewport. `.stage` is `height: 100svh` (grand-entrance.css:74). Design maximum is a 1920 x 1080 full-HD screen. | **3840 x 2160 (4K).** A 9:16 centre crop of 4K is 1215 x 2160, above 2 x a 390 x 844 phone (780 x 1688). |
| B | Carousel slide, 16:9 desktop, 4:5 phone | Proposed slot, not yet in CSS. Container maximum 1200 px (`.wrap`, grand-entrance.css:24). | **2400 x 1350.** A 4:5 phone crop needs only 686 x 858 (343 px x 2). |
| F | 4:3 figure: departments, role shots, family | `.dept-section .pic` (site.css:121) in the widest single-column layout, a 909 px screen: container 909 - 32 = 877, minus the 6 px frame each side = 865 px. 865 x 2 = 1730. | **1800 x 1350** |
| W | 16:10 hero photo on About and Wholesale | `.page-hero .photo-frame img` (site.css:107), same 865 px. | **1800 x 1125** (a 16:10 crop of a 1800 x 1350 frame) |
| A | Arched portrait, 5:6 | `.arch-photo` (grand-entrance.css:182): 460 px wide, 10 px frame, so 440 x 532 inside. 2 x = 880 x 1064. The gold fanlight hides the top 42% (css:184). | **900 x 1080; aim for 1000 x 1200** |
| P | Product card, 6:5 (square on phones, tokens.css:260) | `.deal-photo` (grand-entrance.css:129; tokens.css:237). Largest card is 314 x 262 px (Specials page, 3 columns, tokens.css:254), so 628 x 524 at 2 x. The store admin's Post maker draws each photo into a 1080 x 1350 post, filling by height (admin.js:417, 511), so the source must be at least 1350 px tall. | **1800 x 1500** |
| S | Store front, shot 3:2 | Proposed slot. Figure on the Locations page (up to 865 px), home store card, and a 1200 px carousel slide. | **2400 x 1600.** A 16:9 crop is 2400 x 1350; a 4:3 crop is 2133 x 1600. |

Slots not built yet (carousel, family, role shots, store-front photos) are marked "proposed". Recheck them against the CSS when they land.

**Crop hazards (keep these in mind when composing)**

| Where | Hazard | So |
|---|---|---|
| Hero | Headline sits in the top third; the "Come on in" card covers the lower third at the end (grand-entrance.css:85, 92). | Sky in the top third; waving hands and faces in the upper 60% of the end frame. |
| Home department tiles | A text label covers the bottom ~30% (grand-entrance.css:152). | Subject in the upper 65%. |
| Product cards | The red price seal covers the bottom-left (css:131), the NEW ribbon the top-right (css:137), and the Post maker logo the top-left (admin.js:519). | Product in the middle; three corners empty. |
| Arched frames | Fanlight covers the top 42%. | Face and key subject between 45% and 90% of the height; extra headroom above. |

### 2.1 Home hero: Grand Entrance (Couva) and roof flags

Where: home page `/`, the arrival at `#stage`. Today it is an inline SVG illustration (index.html:48, built by `tools/grand-entrance/make-scene.js`). The page scrubs it with the scroll bar, forwards and backwards.

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-01 | Home hero (`#stage`) | Drone flight at the Couva front: high wide of the whole front, descending and pushing in to the front door, which slides open on staff in red waving | Moves and timings in section 3. Start: whole front in the middle two-thirds of the frame width, top third sky, ground line about 93% down (grand-entrance.js:28-30). End: open door about 60% of frame width, centred, door centre about 40% from the top (js:32). Fly the building's centre line. No moving vehicles. | Landscape 16:9 video | 3840 x 2160 (H) | P0 | Yes: staff in red, release each. No customers. No children. | Couva, 696 Southern Main Road | First light to about 90 min after sunrise, before the store opens. Clear or light cloud. Wind within the drone's limit. | New. Replaces the animated illustration. |
| SL-02 | Home hero: still for reduced-motion, no-JavaScript and slow connections (PRD WEB-013; 15.2 #01) | Still from the exact start position of SL-01: the whole front under a clean sky | Same as the SL-01 start. Sign legible. If the store flies flags, both in frame. | Landscape 16:9 | 3840 x 2160 (H) | P0 | None in frame | Couva | As SL-01 | New |
| SL-03 | Home hero end frame; reduced-motion alternative (PRD 15.2 #03, #04) | Front door open, 3 to 5 staff in red waving, store fully lit behind them | Door about 60% of width, centred, centre 40% from the top. Staff in a row just inside the threshold, faces and waving hands visible, hands in the upper 60%. Shoot a 10 s locked-off video of the same scene too (loop clip, section 3). | Landscape 16:9, still plus video | 3840 x 2160 (H) | P0 | Yes: release each. Adults only. | Couva | Same session as SL-01 | New |
| SL-04 | Home hero on phones | Same flight as SL-01, shot vertical | Opening: the whole front nearly edge to edge, ground line about 80% down, about half the frame above it sky (grand-entrance.js:28-30). Wing ends may crop; keep gable, sign and door in frame. Finish with the door centred. | Portrait 9:16 video | 2160 x 3840 if shot vertical. A centre crop of SL-01 (1215 x 2160) is accepted if not. | P1 | As SL-01 | Couva | As SL-01 | New |
| SL-05 | Home hero: the two roof flags (make-scene.js:89-106) | Company flag in a steady wind, 10 s clips | Flag fills at least half the frame width; pole, cloth and sky visible; one clip with the roofline in frame. Shoot front-lit and back-lit. | Landscape 16:9 video | 3840 x 2160 (H) at 60 fps; add 120 fps slow motion if the camera has it | P1 | None | Couva roof, if the store flies flags (confirm). Otherwise any front where the flags can be fixed safely. | Soft side or back light, steady breeze. If calm, repeat later in the day. | New. Replaces the drawn flags. |
| SL-06 | Home hero: roof flags; cloth artwork | Stills of the flags in wind: (a) full flag, white field, swept pink edges with green lines, cornucopia and "Southern food basket" readable; (b) flag, pole and roofline against sky; (c) pole sleeve and hoist detail | Flag at least half the frame width. Both horizontal and vertical. | Free: shoot 3:2 | Full resolution, at least 3000 px on the long edge | P1 | None | As SL-05 | As SL-05 | New |
| SL-07 | Home hero: flag artwork (make-scene.js:93-104) | Flag laid flat, both sides | Square-on, edge to edge, even light, no creases or shadows. Confirm flag size with the business. | Landscape, 3:2 | At least 3000 px on the long edge | P2 | None | Wherever the flags are kept (confirm) | Diffused daylight or open shade | New. The illustration prints the logo cut-out (`sfb-logo.webp`) on the cloth. |

The real flags are visible in `assets/img/photos/team-flags.webp` and `flags-car.webp`: white field, a swept pink edge top and bottom each with a green line inside, the full cornucopia logo and "Southern food basket" wordmark across the middle, black sleeve on the pole side.

### 2.2 Home banner carousel (4 slides, new)

Proposed slot, not yet in CSS. PRD 16.5: a moving carousel needs pause controls, so every slide needs a still-friendly image and one line of alt text.

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-10 | Carousel slide 1, "Be a part of the family, join the team!" (careers) | 4 to 6 staff in red shirts, welcoming, shop floor or front of store | Shoot two versions: group left with calm space on the right, and the mirror. Faces inside the middle 70% of the width. Shoot in the same set-up as SL-30. | Landscape 16:9 (phone 4:5 crop) | 2400 x 1350 (B) | P0 | Yes: release each. Adults only. No customers. | Couva (confirm) | Pre-opening, store lit, or the shaded entrance. Avoid midday sun. | New |
| SL-11 | Carousel slide 2, specials ("1 FOR $x" posts) | A tidy shelf end or counter showing several products that are on special that week | PRD 15.2 #16: a promo surface with clean space for the live price seal and graphics. No prices, stickers or logos added. | Landscape 16:9 | 2400 x 1350 (B) | P1 | None | Couva, or the store where the week's specials are (confirm) | Bright store light or window light | New |
| SL-12 | Carousel slide 4, ready-cut veg packs and double-layer cakes | One counter scene: a few veg packs beside two or three double-layer cakes in their boxes | True colours. Veg film clean, not fogged. Cakes slightly above eye level so top decoration and two layers show. No prices. | Landscape 16:9 | 2400 x 1350 (B) | P1 | None. Hands only if released. | Couva (the company's posts tag these products at Couva; confirm) | Window light or soft box | New |

Slide 3 (five stores, Couva to Point Fortin) is built from SL-40 to SL-44. See 2.9.

### 2.3 Who is Southern Food Basket? (new section on the home page)

Proposed slot. PRD WEB-005 (P1): approved company story with quality imagery. **Only with consent. The family decides whether they appear at all.** If they decline, the section runs on SL-30 or a store front and nothing is lost.

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-20 | Home, "Who is Southern Food Basket?" (assumed 4:3 figure) | Family portrait. Wording of the section ("a family business from Princes Town") to be confirmed by the family. | Relaxed and unposed. The family chooses who is in it and where. Adults by default (see section 6 on children). Shoot horizontal and vertical. | Landscape 4:3 (and a vertical) | 1800 x 1350 (F) | P1 | Yes: written release from each adult, each free to decline. | Princes Town, or a place the family chooses (confirm) | Open shade or soft window light. Never midday sun. | New |
| SL-21 | Home, "In loving memory" card (arch 5:6) | Memorial photograph of the late Nazim Mohammed, the owners' father. Not a shoot: a photograph the family chooses from their own, scanned or copied at the best quality available. | The family's choice of photograph. If it goes in the arch frame, keep his face between 45% and 90% of the height; never crop or retouch beyond what the family asks. Caption and memorial wording come from the family. | Portrait 5:6 | 1000 x 1200 (A), or the best the original allows | P1 | Yes: the family's written consent. They approve the photograph, the crop, the caption and the wording, and can withdraw it. | From the family | n/a | New |

### 2.4 Team and careers

DEC-005: recruitment is the primary focus, so the team portrait is P0. Role shots are for the Careers page (new strip above "Open roles", proposed).

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-30 | Home Careers section (`.arch-photo`, index.html:117); About hero (about.html:26, 16:10); options A, B, C | Group portrait of the team in red, holding the company flags as in the current photo | 4 to 6 staff, smiling, shop floor or front of store, no customers. Shoot two frames from one set-up: vertical 5:6 with extra headroom (fanlight hides the top 42%), and horizontal 16:10. | Vertical 5:6 (grand-entrance.css:182) and landscape 16:10 (site.css:107) | 1000 x 1200 (A) and 1800 x 1125 (W) | P0 | Yes: release each. Adults only. | Couva (confirm) | Pre-opening store light, or shaded entrance. Avoid midday sun. | `team-flags.webp` |
| SL-31 | Careers, role strip (proposed; PRD 15.2 #14) | Cashier at the till, mid-task | Till screen blank or neutral. No customer, or customer's hands only without faces. One frame looking at the camera, one looking at the work. | Landscape 4:3 | 1800 x 1350 (F) | P1 | Yes: staff release | Couva (confirm) | Store light, store empty | New |
| SL-32 | Careers, role strip | Bakery team member boxing or finishing a double-layer cake | Food-safety clothing as the store requires. Cake as sold. | Landscape 4:3 | 1800 x 1350 (F) | P1 | Yes: staff release | Couva (in-store bakery listed for Couva; confirm) | Store light | New |
| SL-33 | Careers, role strip | Butcher at the counter, portioning or serving | Counter clean and tidy. Hygiene clothing as the store requires. No raw-meat close-ups that look unappetising. | Landscape 4:3 | 1800 x 1350 (F) | P1 | Yes: staff release | Couva (meat section listed for Couva; confirm) | Store light | New |
| SL-34 | Careers, role strip | Produce attendant building a display or packing cut-veg packs | Colourful, tidy. Misted produce, fresh delivery. | Landscape 4:3 | 1800 x 1350 (F) | P1 | Yes: staff release | Couva (confirm) | Store light | New |
| SL-35 | Careers, role strip | Warehouse attendant with stock or a pallet jack | Tidy, safe. Protective clothing the business requires. No forklift unless the operator is certified. | Landscape 4:3 | 1800 x 1350 (F) | P1 | Yes: staff release | Confirm with the business where the warehouse or wholesale stock is. Do not assume. | Warehouse light plus any daylight at the door | New |
| SL-36 | Careers, role strip | Office team member at a desk | Screen blank or neutral. No applicant, payroll or personal documents visible. | Landscape 4:3 | 1800 x 1350 (F) | P1 | Yes: staff release | Confirm with the business where the office is | Window light | New |

### 2.5 Where we are: five store fronts

Proposed slot: a photo on each home-page store card (`#store-grid`, grand-entrance.js:144) and in each branch section of the Locations page (site.js:269, currently no photo, PRD WEB-030). All five are P0 (PRD 15.2 #20 to #24).

Common brief: whole front and sign, slightly off-centre (10 to 15 degrees) to show depth, entrance unblocked, no readable licence plates, no identifiable people. Shoot a wide frame with sky space (for the 16:9 carousel crop) and a 4:3 frame. Shoot 3:2 native. Facade direction is unknown: scout the day before and shoot each front when the sun lights it, not behind it.

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-40 | Home store card; Locations; carousel slide 3 | Couva store front | As the common brief | Landscape 3:2 (crops 16:9, 4:3) | 2400 x 1600 (S) | P0 | None in frame | Couva, 696 Southern Main Road | Dawn or late afternoon, whichever lights the front | New |
| SL-41 | As above | San Fernando store front | As the common brief | Landscape 3:2 | 2400 x 1600 (S) | P0 | None in frame | San Fernando, Coffee Street | As SL-40 | New |
| SL-42 | As above | Princes Town store front | As the common brief. Confirm which building: the "Supermarket" on Manahambre Road or the "Market Place" on St Charles Road, about 60 m apart (data/seed.js:42). | Landscape 3:2 | 2400 x 1600 (S) | P0 | None in frame | Princes Town, St Charles Junction, Manahambre Road | As SL-40 | New |
| SL-43 | As above | Penal store front | As the common brief | Landscape 3:2 | 2400 x 1600 (S) | P0 | None in frame | Penal, S.S. Erin Road | As SL-40 | New |
| SL-44 | As above | Point Fortin store front | As the common brief | Landscape 3:2 | 2400 x 1600 (S) | P0 | None in frame | Point Fortin, 38-40 Point Fortin Main Road | As SL-40 | New |

### 2.6 Departments

Where: home "Walk the aisles" tiles (grand-entrance.js:135, 4:3 at `.aisle img`, css:149), Departments page sections (site.js:191, 4:3, site.css:121), department tiles (site.js:95, site.css:57). One scene per department, not a product close-up. Shoot 4:3 or wider so the 4:3 crop works. Do not photograph a department a store does not have: confirm per store, do not assume. Couva is the suggested location for bakery, fresh-cut veg and health because the company's own posts tag those products at Couva.

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-50 | Fresh produce and cut veg tile, department section; options A, B, C | Produce display, full and colourful, with fresh-cut veg packs on the chilled shelf | Wide, slightly above eye level; "Fruits and Vegetables" sign readable if it is. No shelf price tags in focus. Subject in the upper 65%. | Landscape 4:3 | 1800 x 1350 (F) | P0 | None, or release | Couva (confirm) | Store lit, before opening, fresh stock | `veg-chunky.webp` (department), `store-produce.webp` (fresh slots) |
| SL-51 | Cakes and bakery tile, section | Bakery counter with double-layer cakes in boxes | Counter wide shot, cakes as sold, tidy. | Landscape 4:3 | 1800 x 1350 (F) | P0 | None, or release | Couva (confirm) | Store lit, fresh bake | `cake-red-velvet.webp` (department) |
| SL-52 | Dairy and chilled tile, section | Chilled aisle or fridge, yogurts and chilled treats faced forward | Doors clean, no fog, lights on, shelves full. | Landscape 4:3 | 1800 x 1350 (F) | P0 | None | Confirm store | Store lit, before opening | `chobani-flip.webp` (department) |
| SL-53 | Snacks and sweets tile, section | Snack aisle, chips, popcorn, brownies, pudding cups | Wide aisle with depth, bright. | Landscape 4:3 | 1800 x 1350 (F) | P0 | None | Confirm store | Store lit | `snacks-basket.webp` |
| SL-54 | Health and fitness tile, section | Protein and fitness range shelf | Shelf wide, products faced forward. | Landscape 4:3 | 1800 x 1350 (F) | P0 | None | Couva (confirm) | Store lit | `protein-chips.webp` (department), `protein-crunch.webp` (options A) |
| SL-55 | Personal care tile, section | Toiletries aisle, body washes | Shelf wide, tidy, no price tags in focus. | Landscape 4:3 | 1800 x 1350 (F) | P0 | None | Confirm store | Store lit | `st-ives.webp` (department) |
| SL-56 | Departments page "Bulk and wholesale" (site.js:191); Wholesale page hero (wholesale.html:29, 16:10, site.css:107) | Wholesale stock: cases, bags and pallets, tidy racking | Shoot 3:2 so both 4:3 and 16:10 work. No people unless protective clothing and a release. | Landscape 3:2 (crops 4:3, 16:10) | 1800 x 1350 (F) | P1 | None, or release | Confirm with the business where wholesale stock is held | Warehouse light plus daylight at the door | `store-produce.webp` (wholesale slots) |

### 2.7 Specials product series (25 shots, one set-up)

Where: home deals shelf (grand-entrance.js:128, 12 newest), Specials page (site.js:25), admin list and Post maker (admin.js:174, 246, 692), options A, B, C. Specials are time-limited, so **shoot whatever is on special the week of the shoot** (ask the business for the list); the 25 below are the products on the site today. These are packaged third-party brands: confirm with the business whether supplier brand rules limit use in advertising.

| Series spec | |
|---|---|
| IDs | SL-60 to SL-84 |
| Subject | The product as sold. One clean pack shot each, on a plain warm-white or light-wood surface, soft window light. Optional second frame held in hands (hands only, no faces, release needed). |
| Composition | Product centred in the middle half of the width, between 15% and 70% from the top. Corners empty: bottom-left (price seal), top-right (NEW ribbon), top-left (logo on the 4:5 post). No price tags, stickers or added labels in frame. Packaging straight-on and undistorted. |
| Cakes | Slightly above, 30 to 45 degrees, in the clear box as sold, top decoration and two layers visible. Cake sizes are in the table below. |
| Veg packs | Film clean and unfogged. Shoot within minutes of stocking. |
| Ratio, size | Landscape 6:5 (`.deal-photo`), 1800 x 1500 (P). The Post maker crops to 4:5, so keep the product in the middle 50% of the width. |
| People, release | None (hands only: release) |
| Branch | Wherever the product is stocked. Couva posts tag the veg packs, cakes and protein products (confirm). |
| Light | Window light or soft box; mid-morning is fine; no mixed colour casts. |

| ID | Product (as on the site today) | Dept | Replaces | Pri |
|---|---|---|---|---|
| SL-60 | Chunky veg pack | Fresh | `veg-chunky.webp` | P0 |
| SL-61 | Stir fry veggie pack | Fresh | `veg-stir-fry.webp` | P0 |
| SL-62 | Chow mein pack | Fresh | `veg-chow-mein.webp` | P0 |
| SL-63 | Parsley, fresh bunch | Fresh | `parsley.webp` | P0 |
| SL-64 | Red velvet cake, 9-inch double layer | Bakery | `cake-red-velvet.webp` | P0 |
| SL-65 | Chocolate cake, 9-inch double layer | Bakery | `cake-chocolate.webp` | P0 |
| SL-66 | Sponge cake, 9-inch double layer | Bakery | `cake-sponge.webp` | P0 |
| SL-67 | Coconut cake, 7-inch double layer | Bakery | `cake-coconut.webp` | P0 |
| SL-68 | Almond crumble cake, 7-inch double layer | Bakery | `cake-almond-crumble.webp` | P0 |
| SL-69 | Chobani Creations Greek yogurt, caramel sundae | Chilled | `chobani-creations.webp` | P1 |
| SL-70 | Chobani Flip, almond coco loco | Chilled | `chobani-flip.webp` | P1 |
| SL-71 | Go-Gurt yogurt tubes | Chilled | `gogurt.webp` | P1 |
| SL-72 | Snack Pack pudding cups | Snacks | `snack-pack.webp` | P1 |
| SL-73 | Ripples potato chips | Snacks | `ripples.webp` | P0 |
| SL-74 | Mr. Brownie brownies | Snacks | `mr-brownie.webp` | P0 |
| SL-75 | Coconut Crunch popcorn | Snacks | `coconut-popcorn.webp` | P0 |
| SL-76 | Chee Zees, kick of spice | Snacks | `chee-zees.webp` | P1 |
| SL-77 | Lay's chips, limited edition | Snacks | `lays-limited.webp` | P1 |
| SL-78 | Protein chips, sour cream and onion | Health | `protein-chips.webp` | P0 |
| SL-79 | Protein Crunch bar | Health | `protein-crunch.webp` | P0 |
| SL-80 | St. Ives body wash, citrus and cherry blossom, 650 ml | Care | `st-ives.webp` | P1 |
| SL-81 | Old Spice body wash, Captain | Care | `old-spice.webp` | P1 |
| SL-82 | Irish Spring body wash, aloe mist | Care | `irish-spring.webp` | P1 |
| SL-83 | Tone body wash, Miami glow up | Care | `tone.webp` | P1 |
| SL-84 | Dove body wash, glowing | Care | `dove.webp` | P1 |

P0 here means the newest specials in `data/seed.js` on 28 October 2026 (the home shelf shows 12): the four veg and herb packs, three snacks, two health items and the cakes (the five cakes tie on date, so shoot all five). By shoot day the business's live specials will have moved on; re-mark P0 for whatever is on special that week.

### 2.8 Later (P2)

| ID | Where used | Subject | Framing and composition | Orientation, ratio | Min pixels | Pri | People, release | Branch | Light, time | Replaces |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-90 | Community block; options C (css `.comm-photo`, c:645); seed `community.img` (seed.js:428) | The vehicle that carries the flags on the road (site copy calls it the music truck; confirm) | Flags flying, vehicle moving slowly or parked. No identifiable faces unless released. | Landscape 4:3 | 1800 x 1350 (F) | P2 | Hands or faces: release | Anywhere in the south (confirm) | Soft daylight | `flags-car.webp` |
| SL-91 | Future butcher or counters shot (PRD 15.2 #09) | Butcher counter display, hygienic, accurate presentation | Counter wide, clean glass, lit. | Landscape 4:3 | 1800 x 1350 (F) | P2 | None | Couva (confirm) | Store lit | New |
| SL-92 | Future household shot (PRD 15.2 #12) | Household goods aisle | Wide aisle with depth | Landscape 4:3 | 1800 x 1350 (F) | P2 | None | Confirm store | Store lit | New |
| SL-93 | Future brand texture (PRD 15.2 #15) | Trolley and basket detail | Close, brand colours, no people | Landscape 4:3 | 1800 x 1350 (F) | P2 | None | Any store | Store lit | New |
| SL-94 | Future Couva page (PRD 15.2 #02) | Second Couva exterior angle showing context and entrance | A corner angle, the entrance and sign in frame | Landscape 3:2 | 2400 x 1600 (S) | P2 | None in frame | Couva | Dawn or late afternoon | New |

No pharmacy or restaurant shots are listed. Add them only if the business asks; a pharmacy needs the pharmacist's say-so, and no patient, prescription or label may be photographed.

### 2.9 Slots that need no new shot or no photo

| Slot | What it uses | Photo needed? |
|---|---|---|
| Carousel slide 3, "five stores from Couva to Point Fortin" | The five store fronts, SL-40 to SL-44, cropped 16:9 | No new shot. Shoot each front with sky space for the 16:9 crop. |
| Specials price ticker (home banner) | Live text from the specials data | **No photo.** |
| Follow-us-on-social banner (home) | Logo and links to the company's accounts | **No photo.** If the designers want a background, reuse an approved shot rather than commission one. |
| Logo (header, footer, flags, canopy) | `sfb-logo.svg` and friends, traced from an Instagram post (assets/img/SOURCES.md) | Not a shoot. Ask the business for its official logo files. |
| Store-glass ornaments (`assets/img/glass/`) | Drawn in code by Trinovata, no photo pixels | No. Not third-party. |

---

## 3. Drone and video

### 3.1 Permission and safety first

- **Drone flights in Trinidad and Tobago need Civil Aviation Authority permission. Confirm the current permit requirement with the TTCAA** (operator, aircraft and flight approval, insurance, and any restricted areas near the Couva site). This is not legal advice.
- Written permission from the building owner or landlord and the car-park owner. Tell the neighbours.
- Fly before the store opens, with a cleared car park (cones, no deliveries). No flying over people, vehicles or the road.
- A qualified pilot and a spotter. Scout the site the day before. Batteries for at least 3 takes. A go or no-go call at the site on the morning.

### 3.2 SL-01 flight: numbered moves (20 second master)

The page maps scroll to the clip (grand-entrance.js:43-66): the zoom is eased and finishes at 70% of the scroll, the doors slide open from 62% to 78%, the "Come on in" card fades in from 78%. The timings below follow that.

| # | Time | Move | Camera and framing | Page does |
|---|---|---|---|---|
| 1 | 0:00 to 0:02 | Hold | Hover, still. Whole front in the middle two-thirds of the width, top third sky, ground line about 93% down. Doors shut, staff already inside. | Headline fades out by 10% |
| 2 | 0:02 to 0:08 | Start the descent | Glide forward and down along the centre line, speed building slowly. Camera pitched about 20 to 30 degrees down, levelling as it descends. The front grows to fill the width. | Zoom starts slowly |
| 3 | 0:08 to 0:14 | Push in | Straight at the door, quickest mid-move, easing out. End: level camera, door about 60% of frame width, centred, door centre 40% from the top. Gable, sign and wings leave the frame. | Zoom finishes at 70% (0:14) |
| 4 | 0:12 to 0:16 | Doors open | Closest point, hover with no drift. On a radio or hand cue the staff trigger the sliding doors; they part over about 3 seconds; staff step forward and wave. | Doors slide, 62% to 78% (0:12.4 to 0:15.6) |
| 5 | 0:16 to 0:20 | Hold and wave | Locked hover, door fully open, staff waving at a steady rhythm. | Welcome card fades in |

Shoot long: start rolling at least 3 seconds before move 1 and keep rolling at least 3 seconds after move 5. Take at least 3 passes. Deliver the 2 best untrimmed.

If the last metre or two is not safe for the drone, stop at the safe distance and shoot the last push-in on the ground (a gimbal, one steady walk). Deliver it as part of SL-03 for the web team to join.

### 3.3 Camera settings

| Setting | Spec |
|---|---|
| Resolution | 4K, 3840 x 2160, 16:9. SL-04 vertical 2160 x 3840 if the drone shoots vertical. |
| Frame rate | 30 fps, or 60 fps if available, for smoother scrolling. No slow motion on SL-01 (the page controls the speed). SL-05 flags: 60 fps, plus 120 fps slow motion if available. |
| Shutter | About twice the frame rate (1/60 at 30 fps, 1/120 at 60 fps), using an ND filter. |
| Exposure and white balance | Manual, locked for the whole move. Daylight white balance, locked. The doorway is darker than the facade: expose for the facade, switch on every store light, and put staff in the lit lobby just inside the glass. |
| Stabilisation | Three-axis gimbal, horizon locked. Fly in the drone's slow or cine mode. Use electronic stabilisation only if it does not crop the frame below 4K. No digital zoom. |
| Profile | Standard or neutral, 10-bit if available, unless a colourist is booked. Record to the original file, not proxies. |

### 3.4 Loop-friendly ending

- Final 4 seconds: locked hover, doors fully open, no drift. The web team can freeze or loop the last 2 seconds.
- Staff wave at a steady rhythm. No vehicle, customer or stray person enters the frame.
- Wait for steady light: no sudden cloud shadow in the last seconds. The first and last frame should match in brightness.
- Shoot a separate 10 second locked-off take of the open door and waving staff (part of SL-03) so the loop can be cut cleanly.
- The page plays the clip backwards when someone scrolls up. Keep the car park clear of moving vehicles and people, so nothing looks wrong in reverse.

### 3.5 Fallback if drone permission is refused

Plan the same story from the ground. Same lens, same exposure, a tripod, a tape mark on the centre line. Call these SL-01-F1 to F7; they replace SL-01 and SL-02.

| # | Position | Frame |
|---|---|---|
| F1 | Elevated and far back (a neighbouring upper floor or roof, a hydraulic platform, with the owner's permission), or across the road or car park if there is no height | Whole front in the middle two-thirds of the width, top third sky |
| F2 | Closer, same centre line | Front fills the width |
| F3 | Closer | Gable, sign and canopy fill the frame |
| F4 | Closer | Canopy and door fill the width |
| F5 | Door | Door about 60% of the width, doors closed, centre 40% from the top |
| F6 | Door, burst | Doors part (shoot a burst of 3 to 5 frames) |
| F7 | Door | Doors open, staff waving, hands in the upper 60% |

Also shoot one smooth walk-up on a gimbal, from the far end of the car park straight to the door, 30 to 40 seconds, 4K 30 fps, camera at about 1.5 m. Or hire an operator who already holds TTCAA permission.

---

## 4. Shoot-day plan

### 4.1 Order, to cut travel

Straight-line distances from the coordinates in `data/seed.js` (roads are longer; check a maps app): Couva to San Fernando 15.6 km, San Fernando to Princes Town 5.6 km, Princes Town to Penal 11.0 km, Penal to Point Fortin 24.7 km. Total about 57 km in one chain.

Trinidad is about 10 degrees north of the equator, so sunrise and sunset stay near 6:00 am and 6:00 pm through the year (check the exact times for the date). The sun is high and harsh from about 10 am to 3 pm. Google Maps lists a 7:00 am opening for the stores (unverified; confirm).

| Day | Block | Branch | Shots | Best light |
|---|---|---|---|---|
| 1 | Dawn, before opening | Couva | SL-01, SL-04, SL-02, SL-03, SL-40, SL-94; flags SL-05, SL-06 if there is a breeze | First light to 90 min after sunrise |
| 1 | Interiors: before opening if the business allows early access, otherwise after closing | Couva | Departments SL-50 to SL-55, SL-56 if wholesale stock is here (confirm); team SL-30, SL-10; roles SL-31 to SL-34; specials SL-11, SL-12; product series SL-60 to SL-84 (set up a table by a window or a soft box) | Store lights plus window light; set a custom white balance off a grey card |
| 1 | Late afternoon | Couva | Flags again if the morning was calm; second light on SL-40 | From about 4:30 pm to sunset |
| 2 | Dawn | San Fernando, then Princes Town | SL-41, SL-42 | First light |
| 2 | Midday | Wherever the office or warehouse is (confirm) | SL-35, SL-36, SL-56 if not done at Couva | Interior light |
| 2 | Late afternoon | Penal | SL-43 | Late light |
| 3 | Dawn or late afternoon | Point Fortin | SL-44 | Whichever lights the front |
| 3 | Reserve | Any | Weather retakes, SL-20 (family), pick-ups, P2 shots. SL-21 is a family photograph, not a shoot | Soft light for portraits |

Facade direction decides dawn or late afternoon for each front. A front facing east is best at dawn; one facing west, late afternoon. Scout it the day before.

### 4.2 What staff must prepare

- Shelves full and faced forward, labels straight, expired or damaged stock pulled. Fresh produce delivered and misted. Cakes freshly made and boxed. Veg packs fresh.
- Floors, glass, doors and fridges clean. Sign lights on. Every store light on.
- Car park clear: no delivery trucks, trolleys or stray cones; space for the pilot and spotter.
- Staff in clean, matching red uniform shirts. Name tags off unless the person agrees. Flags clean and steamed: two for the roof, more for the team.
- Price tags correct or turned away. Old promotional signs and old price posters down. Till screens blank or neutral. No personal items, notices or bin bags in view.
- A named manager at each store, with keys and access times, to approve what is photographed.
- Printed release forms for staff (section 6). Spare uniforms.

### 4.3 Weather backup

- Check the forecast 48 hours out and the evening before; go or no-go at the site at about 5 am. The rainy season runs roughly June to December.
- No drone in rain or wind above the aircraft's limit; interiors, product, portraits and role shots do not need sun.
- If the morning is rained out, run the interior block first, then fly in the afternoon window or on the reserve day (Day 3 is built in).
- Flags need a steady breeze. If the air is still, wait or repeat later in the day.

---

## 5. Delivery specs

| Item | Spec |
|---|---|
| Stills, originals | RAW, untouched, in the camera's native format. |
| Stills, edited | JPEG, highest quality, full resolution, sRGB. Straight, level, cropped as the table says. No sharpening for web, no watermark, no added text, logo or price. |
| Video | The untouched camera files, plus one graded 4K export (H.265 or H.264, Rec.709, 8 or 10-bit). If shot in a log profile, deliver the graded export and the original. |
| What the site does | The site converts stills to WebP and re-encodes video for scrolling. Do not deliver web files. |
| File naming | `SL-<ID>_<branch>_<subject>_<YYYYMMDD>_<take>.<ext>`. Branch codes match the site: `couva`, `sando`, `ptown`, `penal`, `pfortin`. Examples: `SL-01_couva_grand-entrance-flight_20261110_T02.mov`, `SL-40_couva_storefront-wide_20261110_003.jpg`, `SL-60_couva_chunky-veg_20261110_001.jpg`. Use `_raw` and `_edit` in a folder name, not in the file name. |
| Folders | `01-RAW/`, `02-EDITED/`, `03-VIDEO/`, `04-CONTACT-SHEET/`. Releases are kept by the business, not in the folder (they are personal data). |
| Manifest | One spreadsheet: ID, file name, take, branch, date, photographer, release reference (not names), alt text, owner approval, approval date, rights. PRD 15.3 asks for photographer, shoot date, rights and model releases to be stored. |
| Alt text | One plain sentence per image saying what is in it. |
| Metadata | Keep EXIF. Fill IPTC: creator, copyright holder, title (ID and subject), description (the alt text), location (branch). |
| Delivery | A shared cloud folder, in one go per shoot day, with the manifest. Agree a deadline in writing. |
| Resolution | Full camera resolution. The minimums in section 2 are after cropping. |

---

## 6. Consent and permissions

| Who or what | What is needed |
|---|---|
| **Staff** | A signed model release from every identifiable person, before they are photographed. It names the uses (website, social, print, advertising), the period, and how to withdraw. Appearing is voluntary: they can say no, with no consequence at work. |
| **Customers** | Avoid them. Shoot when the store is empty, or crop or leave them out. If a customer is identifiable and the image is used, a signed release is needed first. |
| **Children** | None. Site policy is no photos of children (`DESIGN.md`, Imagery). A person under 18 is a child for this purpose. If a minor is unavoidable in a family portrait, written guardian consent and the owners' explicit approval are required; otherwise leave them out. |
| **The late Nazim Mohammed (memorial)** | Only a photograph the family chooses and supplies, with their written consent. They approve the image, caption and every word of the memorial, and can withdraw it. Until then the card shows his name, "father of the family" and "principal" (Dun & Bradstreet) only. Spelling (Nazim or Nasim) to be confirmed with them. |
| **The family** | Entirely their choice, including whether they appear at all. Each adult signs. They approve the images, wording and placement, and can withdraw later. |
| **Premises** | Written permission from the property owner where a store is in a plaza or on leased land. No readable licence plates, no neighbours' faces or premises in frame. |
| **Drone** | TTCAA permission as in section 3.1. |
| **Packaging** | Packaged third-party brands appear in product shots. Ask the business whether supplier rules limit their use in advertising. |
| **Ownership** | Agree in writing, before the shoot, who owns the files and what the business may do with them (web, social, print, edits and crops), the credit, and any reuse by the photographer. |

**Approval.** The owners approve every image before it is published: the subject is truthful (the real store, the real product), the use is permitted, the alt text is right, the crop is right (PRD 15.3). Record each approval in the manifest.

**The Instagram photos come down.** Once an owned image is approved and live, Trinovata deletes the Instagram file it replaces from `assets/img/photos/` (deleted, not merely unreferenced), updates `assets/img/SOURCES.md`, re-takes the four design screenshots in `options/shots/`, redeploys, and ticks the box in section 7. Until then, the concept stays unpublicised (`SITE.md`).

---

## 7. Replacement checklist

Every third-party image on the site today, and the shot that replaces it. Tick when the owned image is approved, live, and the old file is deleted.

Every product photo is drawn by the same code: grand-entrance.js:128 (home shelf), site.js:25 (Specials page), options/a:616, options/b:675, options/c:774, admin.js:174, 246, 692 (admin list, preview, Post maker). Only the extra uses are listed per row.

| Done | File in `assets/img/photos/` | Extra uses (file:line) | Replaced by |
|---|---|---|---|
| [ ] | `cake-almond-crumble.webp` | | SL-68 |
| [ ] | `cake-chocolate.webp` | options/c:530 (hero cake) | SL-65 |
| [ ] | `cake-coconut.webp` | | SL-67 |
| [ ] | `cake-red-velvet.webp` | Bakery department (seed.js:61; grand-entrance.js:135; site.js:95, 191); options/c:572 | SL-64 and SL-51 |
| [ ] | `cake-sponge.webp` | options/c:837 (bakery tile) | SL-66, and SL-51 for the tile |
| [ ] | `chee-zees.webp` | | SL-76 |
| [ ] | `chobani-creations.webp` | | SL-69 |
| [ ] | `chobani-flip.webp` | Chilled department (seed.js:63) | SL-70 and SL-52 |
| [ ] | `coconut-popcorn.webp` | | SL-75 |
| [ ] | `dove.webp` | | SL-84 |
| [ ] | `flags-car.webp` | seed.js:428 (community image); options/c:645 | SL-90 |
| [ ] | `gogurt.webp` | | SL-71 |
| [ ] | `irish-spring.webp` | | SL-82 |
| [ ] | `lays-limited.webp` | | SL-77 |
| [ ] | `mr-brownie.webp` | | SL-74 |
| [ ] | `old-spice.webp` | | SL-81 |
| [ ] | `parsley.webp` | | SL-63 |
| [ ] | `protein-chips.webp` | Health department (seed.js:67) | SL-78 and SL-54 |
| [ ] | `protein-crunch.webp` | options/a:629 (health bay) | SL-79, and SL-54 for the bay |
| [ ] | `ripples.webp` | | SL-73 |
| [ ] | `snack-pack.webp` | | SL-72 |
| [ ] | `snacks-basket.webp` | Snacks department (seed.js:65; not a special) | SL-53 |
| [ ] | `st-ives.webp` | Care department (seed.js:69) | SL-80 and SL-55 |
| [ ] | `store-produce.webp` | Wholesale department (seed.js:71); wholesale.html:29 (hero); options/a:628, options/b:541, options/c:515, 836 (fresh slots) | SL-56 for the wholesale slots; SL-50 for the fresh slots |
| [ ] | `team-flags.webp` | index.html:117 (and template :103); about.html:26; options/a:456, options/b:560, options/c:677 | SL-30 (and SL-10 for the carousel) |
| [ ] | `tone.webp` | | SL-83 |
| [ ] | `veg-chow-mein.webp` | | SL-62 |
| [ ] | `veg-chunky.webp` | Fresh department (seed.js:59) | SL-60 and SL-50 |
| [ ] | `veg-stir-fry.webp` | options/c:535 (hero tray) | SL-61 |

Other third-party or stand-in media:

| Done | Item | Where | Replaced by |
|---|---|---|---|
| [ ] | Animated illustration of the Couva front (contains the company logo on the canopy and flags) | `tools/grand-entrance/scene.svg`; inline at index.html:48; concept note at index.html:64 | SL-01, SL-02, SL-03 (SL-04 for phones; SL-05 to SL-07 for the flags) |
| [ ] | Logo files traced from an Instagram post (`sfb-logo.svg`, `sfb-logo.webp`, `sfb-mark.svg`, `sfb-mark.png`, `favicon-64.png`, `apple-touch-icon.png`) | Header, footer, portal, canopy, flags | Not a shoot. Official logo files from the business. |
| [ ] | Design screenshots, with the Instagram photos inside them | `options/shots/option-a.webp` to `option-d.webp` (options/index.html:154) | Re-shoot after the photo swaps |

---

## 8. To confirm with the business

1. Who signs off images, and a contact at each store.
2. Whether the Couva front has roof flagpoles. If not, whether two can be fixed for the shoot with the landlord's permission.
3. Whether the Couva front matches the illustration (a central glass gable between two wings, sign on the right wing, canopy over the door), which Trinovata drew from photos of the stores. The pilot should scout it.
4. Which Princes Town building to photograph (Supermarket on Manahambre Road or Market Place on St Charles Road).
5. Which departments and counters each store has. Photograph only what exists.
6. Where the warehouse, wholesale stock and office are.
7. Opening and closing times, and whether staff can come in early (interiors before opening) or the shoot can run after closing.
8. The week's specials list (so the product series matches what is on the shelf).
9. Whether the family agrees to appear; whether they want the memorial for Nazim Mohammed, with which photograph and in what words.
10. Official flag artwork and flag size, and the official logo files.
11. Photographer ownership and licence terms, and the delivery deadline.
12. The TTCAA permit requirement and who holds it.
13. Whether supplier brand rules restrict showing branded packaging.
