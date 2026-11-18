# Image provenance

The files listed here are in `public/assets/img/`. This note sits in `docs/` so the site never serves it.

Policy (DESIGN.md v2): real imagery only. No stock, no AI-generated food, no photos of children.

Every image here comes from Southern Food Basket's own public Instagram posts, which Gregg downloaded and
supplied on 2026-10-23 (folder `Downloads/Food Basket`, 58 photos and 2 videos). They are **third-party media**:
the company owns them. They are used in this unofficial concept to show the business its own brand; there is no
permission recorded to publish them. Do not show this concept publicly (trinovata.com/work, social) without that
permission.

Processing: cropped and resized with ffmpeg to 800 px wide WebP (quality 80). Product crops remove the company's
baked-in logo, "NEW PRODUCT" corner and "1 FOR $x · TRY ME" badge; the site re-renders prices as live text from
`lib/seed.ts`. Post dates come from the Unix timestamp in each downloaded file name.

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

## Deliveries catalogue: stock photographs (17 Nov 2026)

An exception to the policy above, asked for in chat on 17 Nov 2026 for the Deliveries page only: because the stores'
stock is not counted yet, the catalogue shows a picture of the *kind* of item (coffee, tea bags, water), not a product
the company sells. The page says so under every grid ("Pictures show the kind of item, not the brand"). They are
**not** the company's photographs and show no brand the company is known to carry; shots with a readable brand name
were passed over.

Licence: Unsplash Licence, https://unsplash.com/license (free to download and use for commercial and non-commercial
purposes, no permission needed, attribution not required; not to be sold unaltered or compiled into a competing
service). Found on 17 Nov 2026 through Unsplash's own search with its free-licence filter (`license=free`, which
leaves out Unsplash+). Three photo pages were opened as a spot check (instant coffee, soft drinks, disinfectant) and each says "Free to use under the Unsplash License"; the other 23 were not opened one by one, so confirm the licence on the page linked
below before any real use.

Processing: Unsplash's image service, centre crop to a 640 px square, WebP quality 76. Files:
`public/assets/img/stock/deliveries/<item>.webp`, named after the catalogue item in `lib/ops/delivery-catalogue.ts`.
Column A is on the site. Column B is a spare that was looked at and can replace A (not stored in the repository). Both are pictured side by side in `docs/deliveries-photo-options.jpg`.

| Item | File | A: on the site | B: spare |
|---|---|---|---|
| Instant coffee | `coffee-instant.webp` | Karyna Panchenko, https://unsplash.com/photos/8J0k0H8jM44 (photo-1648127688766-16c834c5f558) | Karyna Panchenko, https://unsplash.com/photos/Ld4Ok5Ps5fg (photo-1648127688906-d230b7b31658) |
| Ground coffee | `coffee-ground.webp` | Gabriel Mihalcea, https://unsplash.com/photos/kKSlbrUiTjM (photo-1640958899669-12f9b327d38f) | Katy Tomei, https://unsplash.com/photos/PX6t5jB5I7k (photo-1583675655650-14f3b111164d) |
| Tea bags | `tea.webp` | Lynda Sanchez, https://unsplash.com/photos/JjvLtQcegb0 (photo-1546648596-d8318bfcf491) | Arwen, https://unsplash.com/photos/h960eaYVKbI (photo-1770447425468-c74f275ab8dc) |
| Hot chocolate | `choc.webp` | Maddi Bazzocco, https://unsplash.com/photos/MjZq7A2RJxQ (photo-1542990253-0d0f5be5f0ed) | Anastasia Eremina, https://unsplash.com/photos/ANj8BrYRmRU (photo-1603052875230-416ab3bc0545) |
| White sugar | `sugar-white.webp` | Immo Wegmann, https://unsplash.com/photos/gUORqj2KYGE (photo-1673791031202-ebc0eea03bf2) | Zoshua Colah, https://unsplash.com/photos/AQv1UhsnkqE (photo-1769259397222-33e425659c43) |
| Brown sugar | `sugar-brown.webp` | Kairi Kaljo, https://unsplash.com/photos/fO1x0m1PSY0 (photo-1704079611177-a3a60ce6f975) | Monika Grabkowska, https://unsplash.com/photos/zYGQQepKJOY (photo-1613228295977-3b5ac7533b36) |
| Coffee creamer | `creamer.webp` | Jackson Barger, https://unsplash.com/photos/WnSqqgzMYng (photo-1794505698580-e26b045d01bf) | Rapha Wilde, https://unsplash.com/photos/zWuQnr_pGl0 (photo-1765057819356-fe311aa729ef) |
| Powdered milk | `milk-powder.webp` | HowToGym, https://unsplash.com/photos/S9NchuPb79I (photo-1593095948071-474c5cc2989d) | Alex Saks, https://unsplash.com/photos/iYWf4PEd-lI (photo-1704650312191-005ab02786f5) |
| Bottled water, small | `water-small.webp` | Jonathan Chng, https://unsplash.com/photos/OTDyDgPoJ_0 (photo-1536939459926-301728717817) | Steve A Johnson, https://unsplash.com/photos/N-MqWXXZvNY (photo-1523362628745-0c100150b504) |
| Bottled water, large | `water-large.webp` | charlesdeluvio, https://unsplash.com/photos/nfDBmg1K4Uw (photo-1616118133712-8c947f7b822c) | charlesdeluvio, https://unsplash.com/photos/edBR3b2JAuA (photo-1616118132534-381148898bb4) |
| Soft drinks | `soft.webp` | Ambo Ampeng, https://unsplash.com/photos/xUbwh9_YGR4 (photo-1696739696228-eee49592ff07) | Qasim Malick, https://unsplash.com/photos/i597Mg_WSPw (photo-1629654613528-5d0a2e4166de) |
| Juice, small | `juice-small.webp` | Jona Novak, https://unsplash.com/photos/1y5yPZ0grys (photo-1621506289894-c3a62d6be8f3) | Anna Wlodarczyk, https://unsplash.com/photos/hOThghGqaoU (photo-1579892515558-4233fb3a7f06) |
| Juice, 1 litre | `juice-large.webp` | Paul Hanaoka, https://unsplash.com/photos/8WYjqXqNZs4 (photo-1587015990127-424b954e38b5) | Piero Nigro, https://unsplash.com/photos/5aOzeDw_hcc (photo-1640213505284-21352ee0d76b) |
| Crackers | `crackers.webp` | Sergey Kotenev, https://unsplash.com/photos/Rj_7cTLayi8 (photo-1690983318341-598b223c6560) | Obi, https://unsplash.com/photos/ryI-Na9KATg (photo-1637010640564-dce7b13c9734) |
| Sweet biscuits | `cookies.webp` | Aditya Kulkarni, https://unsplash.com/photos/DpL-I3hyjO4 (photo-1621353354739-1420ff28ead9) | Shreyak Singh, https://unsplash.com/photos/bZ_mzIMuTLI (photo-1590400926865-1c70a2586bb5) |
| Peanuts | `nuts.webp` | Sketch, https://unsplash.com/photos/8LbcvCZnmyw (photo-1546545584-c03ac781caaf) | Fidias Cervantes, https://unsplash.com/photos/4-lD-BSL99I (photo-1596503799872-5c5f052c27b9) |
| Paper cups | `cups.webp` | Vlad Deep, https://unsplash.com/photos/Q3EOR8YuTDE (photo-1761301356020-9444536867b1) | Brando Makes Branding, https://unsplash.com/photos/rlpjYDltnS0 (photo-1574585046455-827418063fc1) |
| Napkins | `napkins.webp` | Thirteen .J, https://unsplash.com/photos/fukXfOSc3QA (photo-1522124550671-435c7a7a6a71) | Dan Burton, https://unsplash.com/photos/04ZMu2-vusI (photo-1594394490968-27be98131d4c) |
| Paper towels | `paper-towels.webp` | Kier in Sight Archives, https://unsplash.com/photos/OnCvMDd9SIM (photo-1620778864482-5f20e3d9745a) | Brandon Cormier, https://unsplash.com/photos/OzwR9wlCV8w (photo-1632334994199-cc2ba6538141) |
| Toilet paper | `toilet-paper.webp` | colourblindkevin.art, https://unsplash.com/photos/jEMcrcWSf3M (photo-1631524254770-03abe3f42a0d) | Claire Mueller, https://unsplash.com/photos/3HoHDoFL5gM (photo-1583496597549-0fd8b25e34e2) |
| Dish soap | `dish-soap.webp` | Alessandro Skocir, https://unsplash.com/photos/6VZpx-EMnS8 (photo-1589144617445-b4d0fcdf5350) | Karolina De Costa, https://unsplash.com/photos/6w_RiUhcbnA (photo-1653248773863-d7a474f90ec8) |
| Sponges and scourers | `sponges.webp` | Volodymyr Hryshchenko, https://unsplash.com/photos/WU9dA3C4R28 (photo-1577369117918-7e3785e39cb7) | Viktor Zhulin, https://unsplash.com/photos/1vaqMTDtJRA (photo-1707857594916-d8ee9d468f25) |
| Hand soap | `hand-soap.webp` | Manda Hansen, https://unsplash.com/photos/x-lYWjCwgcc (photo-1616622236995-cb00e537365e) | Towfiqu barbhuiya, https://unsplash.com/photos/FcST_JEc3Dc (photo-1634043319737-e4df206ab5b9) |
| Bleach | `bleach.webp` | Alexandr Kornienko, https://unsplash.com/photos/iHqzvk7C3eM (photo-1639112389900-a858bf671be1) | Sufyan, https://unsplash.com/photos/9wCOqpBJRHI (photo-1649005011845-ef225c89da86) |
| Disinfectant cleaner | `disinfectant.webp` | JESHOOTS.COM, https://unsplash.com/photos/__ZMnefoI3k (photo-1563453392212-326f5e854473) | Parth Shah, https://unsplash.com/photos/940wS2deo9k (photo-1617537230936-bb8c9327e84f) |
| Garbage bags | `garbage-bags.webp` | Sven Brandsma, https://unsplash.com/photos/N1iA4RykxtI (photo-1611830696076-462acd8aa9e9) | Seen, https://unsplash.com/photos/m4gEWFCTRhU (photo-1686795516385-e92043f6f389) |
