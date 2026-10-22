# Southern Food Basket — DESIGN.md (binding for this concept)

Concept brand created by Trinovata on 2026-10-22 for an unsolicited prototype. Nothing here is sourced
from Southern Food Basket Ltd; it is our proposal. Record every token change in this file first.

## Positioning
"The South's basket." A grocer that is local, dependable and modern. Quiet confidence over shouting
specials. Wholesale and export are a first-class story. Copy is plain, specific and short; no exclamation
marks in headings; no "unbeatable / amazing / adventure" filler.

## Colour (tokens in `assets/css/tokens.css`)
| Token | Hex | Use | Contrast note |
|---|---|---|---|
| `--green` Basket Green | `#14532D` | primary: header, links, primary buttons | white on it 9.1:1 |
| `--leaf` Deep Leaf | `#0B3B22` | dark surfaces, footer, sidebar | cream on it > 12:1 |
| `--clay` Clay | `#C2410C` | accent: CTAs, specials tags, active states | on cream 4.8:1; white on it 5.2:1 |
| `--cream` Cream | `#FAF7F0` | page background | |
| `--flour` Flour | `#FFFFFF` | cards, inputs | |
| `--ink` Charcoal | `#1C1917` | body text | on cream 16:1 |
| `--muted` Stone (text) | `#625C57` | secondary text | on cream 6.2:1 |
| `--line` | `#E7E2D9` | borders, dividers | non-text |
| `--ok` / `--ok-bg` | `#3F6212` / `#ECFCCB` | verified, approved | 6.6:1 on cream |
| `--warn` / `--warn-bg` | `#92400E` / `#FEF3C7` | pending, expiring | 6.5:1 on cream |
| `--bad` / `--bad-bg` | `#991B1B` / `#FEE2E2` | flagged, rejected | 7:1 on cream |
Status colours are never used alone: every badge carries a text label.
`#78716C` and `#65A30D` exist only for icons/borders/charts, never for text.

## Type
- Display: **Fraunces** (variable, opsz 9–144, wght 400–700). Headlines, prices on specials, payslip total.
- UI/body: **Manrope** 400–800. `font-variant-numeric: tabular-nums` on prices, tables, payslips.
- Scale (rem): 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 2 · 2.5 · 3.25 (clamped on display sizes).
- Line length ≤ 68ch on prose. Headings tight (1.05–1.15), body 1.6.

## Space, shape, motion
- 4px grid: `--s1..--s12` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128. Sections breathe (≥ 64px at desktop).
- Radius: `--r-sm 6px`, `--r 12px`, `--r-lg 20px`, pills for badges. Shadows barely there (`--shadow`).
- Motion 150–250ms ease-out; nothing bounces; `prefers-reduced-motion` turns transitions off.
- Mobile first. Nav collapses under 910px. No horizontal overflow at 375px.

## Mark
Wordmark "Southern Food Basket" in Fraunces 600 with a woven-basket glyph (inline SVG in `ui.js`,
our own asset). Monogram "SFB" for favicons and the app sidebar.

## Imagery
Generated images only (provenance in `assets/img/SOURCES.md`). No stock, no scraped photos, no real
people. Photographic, warm late-afternoon light, deep greens and cream, nothing garish.

## Honesty
Footer disclaimer on every page; dismissable banner on careers/HR/portal pages. Text:
"Unofficial concept by Trinovata. Not affiliated with Southern Food Basket Ltd. All people, jobs,
prices and documents are demo data." Branch addresses are marked "from public directories" in `SITE.md`.

## Contract for page builders (read before touching HTML)
- Every page: `<html lang="en" data-root="./">` (or `../` in subfolders). Include in this order:
  `tokens.css`, the section stylesheet (`site.css` or `app.css`), then `data/seed.js`, `store.js`, `ui.js`,
  then the page script. `ui.js` reads `data-root` to build links.
- Public pages: `<header data-sfb-header data-active="specials"></header>` … `<footer data-sfb-footer></footer>`.
- App pages (careers/hr/portal): `<body data-app="portal" data-active="schedule" data-banner>` and a
  `<main class="app-main" data-app-main>`; `ui.js` wraps it in the sidebar + topbar shell.
- Render user-supplied strings via `SFBUI.esc()` or `textContent`, never raw into `innerHTML`.
- Prices via `SFBStore.money()`; one unit per number ("TTD 12.99 / lb"). Dates via `SFBUI.fmtDate()`.
- State lives only in `SFBStore` (localStorage). Never store file bytes; keep name/size/type/state.
