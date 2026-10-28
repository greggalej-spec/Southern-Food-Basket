# Southern Food Basket — DESIGN.md (binding for this concept)

Version 2, 2026-10-23. Replaces the first concept's forest-green "premium grocer" look, which Gregg judged
too modern for the audience. The direction is now traditional and warm, built from the company's real brand
(logo and photos from its Instagram, supplied by Gregg). Design context: `.impeccable.md`. Record every token
change here first.

## Positioning
"The south's neighbourhood grocer." Two audiences at once: older in-person shoppers and millennials who know
the store from Instagram. Familiar supermarket structure, loud prices, calm everything else. Copy is plain,
specific and warm; no exclamation marks in headings; no "unbeatable / amazing / adventure / elevate / seamless".

## Colour (tokens in `styles/tokens.css`; names kept from v1 so every page re-themes)
| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--pink` brand raspberry | `#E3336F` | logo pink: ribbons, large headings, decorative fills | large text only (4.0:1 on cream) |
| `--clay` pink ink | `#B8195A` | accent buttons, eyebrows, active states, pink text | white on it 6.3:1; on cream 6.0:1 |
| `--clay-dark` | `#8F1446` | hover for pink ink | white on it 8.9:1 |
| `--pink-wash` | `#FCE4EC` | pink tint surfaces | ink on it 13.8:1 |
| `--green-brand` | `#2A8A45` | logo green: ribbons, decorative | large text only |
| `--green` green ink | `#1D6B35` | primary buttons, links, nav band | white on it 6.6:1; on cream 6.2:1 |
| `--leaf` deep green | `#123F22` | footer, utility bar, portal sidebar | cream on it 11.3:1 |
| `--green-wash` | `#E3F2E6` | green tint surfaces | green ink on it 5.7:1 |
| `--red` seal red | `#D3202D` | price seals, "NEW" corner, staff-polo red | white on it 5.2:1 |
| `--yellow` price pill | `#FFD21A` | price pills, nav active marker | ink on it 11.4:1 |
| `--orange` fruit | `#F26A2E` | icons and dots only, never text | 2.9:1, decorative |
| `--cream` page | `#FFF8F1` | page background | |
| `--flour` paper | `#FFFDFA` | cards, inputs (never pure white) | |
| `--wash` | `#F8EEE6` | quiet bands | |
| `--ink` | `#2A1A1F` | body text, pink-tinted near-black | 15.8:1 on cream |
| `--muted` | `#66525A` | secondary text | 6.8:1 on cream |
Status colours (ok / warn / bad / info) keep their v1 values and always carry a text label.

## Type
- Display: **Caprasimo** (single weight). h1 and h2 only, plus the seal-free headline moments. Echoes the
  Cooper-style wordmark.
- Text and UI: **Atkinson Hyperlegible Next** 400 / 600 / 700 / 800, chosen for low-vision legibility. h3, h4,
  product names, buttons, labels, tables.
- Prices in seals: **Alfa Slab One**, echoing the flyer numerals. Nowhere else.
- Base size 17 px (1.0625rem); public body copy 18 px; lede 20 px. Line height 1.6 body, 1.1 headings.
  `tabular-nums` on prices, tables and payslips. Line length ≤ 68ch.

## Ornament (brand-sourced, use sparingly)
- **Wave ribbon** from the company's flags: a pink wave over a thin green wave. Under the nav band and between
  major home sections, never more than three on a page. `.ribbon` in tokens.css.
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
- Public pages: utility bar (hours, branches, staff link) → logo masthead → green nav band with yellow active
  marker → wave ribbon → content → deep-green footer listing every branch.
- Mobile: masthead shows the logo and a labelled "Menu" button; the menu opens as a full-width list with
  56 px rows.
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
- Fonts come from `lib/fonts.ts` (`next/font`): Caprasimo, Atkinson Hyperlegible Next and Alfa Slab One.
- Public pages render inside `<SiteFrame>`; app pages inside `<AppShell app="…" active="…">`. Each names the
  section stylesheets it needs (`css={["app", "hr"]}`), which load from `styles/`.
- React escapes text; `dangerouslySetInnerHTML` is banned by lint except for the generated home scene. Prices via
  `money()` from `lib/format.ts` (TTD) or `<PriceSeal>`; dates via `fmtDate()`. State only through `lib/store.ts`
  (`useData`, `update`); never store file bytes.
