# Southern Food Basket — DESIGN.md (binding for this concept)

Version 3, 2026-10-28: **one design across the site.** The Grand Entrance (design D, the home page) is the main
design, and every other page follows it: the inner pages, careers, the staff portal, HR and the store admin
(Gregg, 2026-10-28: "we're working with the main design … the landing page has the core info but the sub pages
are more detailed"). Version 2 (2026-10-23) replaced the first concept's forest-green "premium grocer" look,
which Gregg judged too modern for the audience; the direction stays traditional and warm, built from the
company's real brand (logo and photos from its Instagram, supplied by Gregg). Design context: `.impeccable.md`.
Record every token change here first.

## One design: the home is the reference
- `styles/home.css` is the reference. Sub-pages carry the same chrome and tokens in `styles/tokens.css` (the
  floating top bar, the facade footer, buttons, eyebrows) and the same section patterns in `styles/site.css`.
  The two files are separate because the home is its own document; a change to one is a change to both.
- The home holds the **core** of each subject; its detail page goes deeper, and every home band links to it:

| Home band | Core, on the home | Detail page | What the detail page adds |
|---|---|---|---|
| Specials `#deals` | the 12 newest posts on a shelf | `/specials` | every posted price, department and Couva filters, post dates |
| Careers | three reasons and two buttons | `/careers` | every open job with store and department filters, all four reasons, how applying works |
| Who `#who` | memorial card, "a family business", the route | `/about` | the same memorial card and route, every store linked, how the stores run, the community, the sourced company record |
| Departments `#aisles` | tiles and the counters | `/departments` | each department's lines and its recent specials, the wholesale side |
| Stores `#stores` | address, today's hours, phone, directions | `/locations` | the full week, plus codes, counters, the second Princes Town listing, Google Maps view, the WhatsApp channel |
| (no band) | a link under the department tiles, plus the top bar and footer | `/wholesale` | product lines, how trade works, the trade enquiry form (demo) |

- New detail must trace to SITE.md's sourced facts or be labelled demo data where it appears.

## Positioning
"The south's neighbourhood grocer." Two audiences at once: older in-person shoppers and millennials who know
the store from Instagram. Familiar supermarket structure, loud prices, calm everything else. Copy is plain,
specific and warm; no exclamation marks in headings; no "unbeatable / amazing / adventure / elevate / seamless".

## Colour (tokens in `styles/tokens.css`, values from design D's `.ge-root` block; names kept from v1 so every page re-themes)
v3 changes (2026-10-28): `--cream` `#FFF8F1` → `#FBF6EC`, `--muted` `#66525A` → `#5E4E54`, `--line` `#EBDDD3` →
`#E6DCC8`, `--line-strong` `#D9C6BA` → `#CFC4AC`, `--wash` `#F8EEE6` → `#F3ECDD` (design D's facade), `--r` 12 → 14 px,
`--r-btn` 10 → 12 px; added `--paper`, `--pink-ink`, `--sign`, `--gold`, `--teal`, `--teal-ink`, `--teal-deep`,
`--teal-light`, `--facade` and the `.btn-sign`, `.btn-glass`, `.btn-outline` buttons. Contrast measured 2026-10-28.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--pink` brand raspberry | `#E3336F` | logo pink: ribbons, large headings, decorative fills | large text only (3.9:1 on cream) |
| `--clay` / `--pink-ink` pink ink | `#B8195A` | eyebrows, active states, pink text | white on it 6.3:1; on cream 5.9:1; on wash 5.4:1 |
| `--sign` sign red | `#C81A35` | the red of the store sign: act-and-join buttons (`.btn-sign`), the Careers quick link | paper on it 5.7:1 |
| `--teal-ink` / `--teal-deep` glass | `#1C6863` / `#164F4B` | the stores: `.btn-glass`, the stores band, the Stores quick link | paper on them 6.4:1 / 9.2:1 |
| `--teal` / `--teal-light` / `--gold` | `#2F918A` / `#A3DCD5` / `#E9C460` | glass and fanlight fills | decorative only |
| `--paper` | `#FFFDFA` | the home's name for `--flour` | |
| `--facade` | `#F3ECDD` | the store front's cream; `--wash` takes this value | ink on it 14.1:1; muted 6.6:1 |
| `--clay-dark` | `#8F1446` | hover for pink ink | white on it 8.9:1 |
| `--pink-wash` | `#FCE4EC` | pink tint surfaces | ink on it 13.8:1 |
| `--green-brand` | `#2A8A45` | logo green: ribbons, decorative | large text only |
| `--green` green ink | `#1D6B35` | primary buttons, links, nav band | white on it 6.6:1; on cream 6.2:1 |
| `--leaf` deep green | `#123F22` | footer, utility bar, portal sidebar | cream on it 11.3:1 |
| `--green-wash` | `#E3F2E6` | green tint surfaces | green ink on it 5.7:1 |
| `--red` seal red | `#D3202D` | price seals, "NEW" corner, staff-polo red | white on it 5.2:1 |
| `--yellow` price pill | `#FFD21A` | price pills, nav active marker | ink on it 11.4:1 |
| `--orange` fruit | `#F26A2E` | icons and dots only, never text | 2.9:1, decorative |
| `--cream` page | `#FBF6EC` | page background | |
| `--flour` paper | `#FFFDFA` | cards, inputs (never pure white) | |
| `--wash` | `#F3ECDD` | quiet bands | |
| `--ink` | `#2A1A1F` | body text, pink-tinted near-black | 15.4:1 on cream |
| `--muted` | `#5E4E54` | secondary text | 7.2:1 on cream; 7.7:1 on paper |
Status colours (ok / warn / bad / info) keep their v1 values and always carry a text label.

## Type
The team chose type system 7, "Homey serif and hand", on 13 Nov 2026 (`docs/brand-options/type-system-7.png`).
- Display: **Lora** Bold. h1 and h2, and the headline moments. A warm bookish serif.
- Text and UI: **Karla** 400 / 600 / 700 / 800. h3, h4, product names, buttons, labels, tables.
- Figures and prices in seals: **Karla** ExtraBold.
- Accent: **Kalam** (handwriting), for the season's greeting, a thank-you, a note in the margin. Never body copy.
- Base size 17 px (1.0625rem); public body copy 18 px; lede 20 px. Line height 1.6 body, 1.1 headings.
  `tabular-nums` on prices, tables and payslips. Line length ≤ 68ch.

## Ornament (brand-sourced, use sparingly)
- **Wave ribbon** from the company's flags: a pink wave over a thin green wave. On the lower edge of a page
  hero and between major home sections, never more than three on a page. `.ribbon` in tokens.css.
- **Price seal** from the company's posts: scalloped red seal, "1 FOR" on top, yellow pill with the price,
  "TRY ME" banner below. `SFBUI.seal(price)`. Only on product photos.
- **NEW corner** from the posts' "NEW PRODUCT" ribbon. Only on items the post marked new.

## Brand logic on the home page (design D, Grand Entrance)
Each motif means one thing, so a shopper learns it once:
- **Wave = movement.** Ribbons between sections (three at most) and the route line joining the five stores.
- **Seal = a price.** Only on product photos, never as decoration.
- **Fanlight arch = people.** Taken from the store's arched windows; it frames the careers photo and the
  "In loving memory" card, nothing else.
- **Red = act, and join.** Primary buttons and the staff polos; the careers line is "Be a part of the family,
  join the team!" (Gregg, 2026-10-28).
- **Teal glass = the stores.** "Find your store" buttons and the stores band.
- **Pink and green flags = the company.** Drawn from its real flags, logo included, flying as cloth.
- **The memorial card is still.** No motion and no ornament beyond the arch; the family supplies any words or
  photograph.
- **Living layer** (`lib/home/living.ts`): hand-written physics, no libraries. Cloth flags with soft, shadow-only
  fold shading; a crew whose arms are jointed and who each wave on their own rhythm; palms that rock and lean
  into scroll gusts; birds; bunting over the specials; swinging seals; word-mask reveals. Every job sleeps off
  screen; under reduced motion none of it runs and the scene holds a still pose. No reflections or glints on
  the glass (removed at Gregg's request, 2026-10-28). The hero is labelled a prototype: final visuals and drone
  footage come when the project begins.

## Structure
- Public pages (v3, from design D): the floating top bar (logo, the main links, a red "Careers" and a teal
  "Stores" quick link, a labelled "Menu" below 980 px) → a page hero (fanlight eyebrow, Caprasimo h1, lede, a
  wave ribbon on its lower edge) → bands → the facade footer (store-front band over deep green, every branch).
  On the home the bar is fixed over the scene; on sub-pages it is sticky, so it never covers the hero.
- Buttons, by meaning: `.btn-sign` (red) to act or join on public and careers pages; `.btn-glass` (teal) for
  stores and directions; `.btn-outline` (paper) for the second choice. Inside the staff tools (portal, HR,
  admin) the main action stays green ink (`.btn-primary`), so red never sits beside reject, flag or delete.
- Staff tools: deep-green sidebar with the mark, a floating paper top bar like the home's, cream canvas,
  cards with the warm 1 px border and the 14 px radius.
- Mobile: the bar shows the logo, the two quick links and a labelled "Menu" button; the menu opens below the
  bar as a list with 56 px rows.
- Cards have a 1 px warm border and almost no shadow; no nested cards; no side-stripe borders.
- Motion 150–250 ms ease-out on hover and open/close only; `prefers-reduced-motion` removes it. The one
  exception is the home page's living layer (Brand logic, above).

## Imagery
Real only. The logo is cut from a company photo; product and store photos are the company's own Instagram
posts, cropped to remove their baked-in logo and price badges (prices are re-rendered as live text). No photos
of children; event photos only of staff in uniform. Provenance in `docs/SOURCES.md`.

## Honesty
- Footer disclaimer on every page; dismissable banner on careers, HR and portal pages.
- Real prices show their Instagram post date. Hours, phone numbers, jobs, people and documents are demo data
  and say so where they appear.
- Branch addresses come from public directories (unverified); Couva comes from the location tag on the
  company's posts.

## Contract for page builders
- Fonts come from `lib/fonts.ts` (`next/font`): Lora, Karla and Kalam.
- Public pages render inside `<SiteFrame>`; app pages inside `<AppShell app="…" active="…">`. Each names the
  section stylesheets it needs (`css={["app", "hr"]}`), which load from `styles/`.
- React escapes text; `dangerouslySetInnerHTML` is banned by lint except for the generated home scene. Prices via
  `money()` from `lib/format.ts` (TTD) or `<PriceSeal>`; dates via `fmtDate()`. State only through `lib/store.ts`
  (`useData`, `update`); never store file bytes.
