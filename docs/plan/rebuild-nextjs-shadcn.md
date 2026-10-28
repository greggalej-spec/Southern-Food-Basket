# Rebuilding Southern Food Basket on Next.js + shadcn/ui: plan and cost

Plan only; nothing has been started. Written 2026-10-28 because Gregg asked: "Write me a plan and cost for rebuilding
the site on Next.js and shadcn, without starting it." It answers item 1 of "Blocked: decision needed" in
`docs/audit/directive-gap.md`.

Every hour figure is a judgement estimate. The pricing ledger (`~/.trinovata/pricing-ledger.jsonl`) does not exist
yet, so nothing has calibrated these figures. Every price is TTD. Re-run them with `node tools/rebuild-cost.mjs`; it
reads its rates from `Products/Trinovata-Docs/.claude/worktrees/pricing/finance/menu.mjs`.

## The answer

| Scope | Hours | Gregg's time at cost | Floor (2.5×) | List (3.0×) |
|---|---|---|---|---|
| **A. Port the concept**: same mock, no backend | 80–122 | 12,800–19,520 | 32,000–48,800 | 38,400–58,560 |
| **B. Make it real**: accounts, database, KYC vault, live admin (normal client) | 150–226 | 24,000–36,160 | 60,000–90,400 | 72,000–108,480 |
| B with the "involved" client factor (×1.2) | 180–271 | 28,800–43,392 | 72,000–108,480 | 86,400–130,176 |
| House menu cross-check for B, normal | 183 | | 73,460 | 88,152 |
| House menu cross-check for B, involved | 219 | | 88,092 | 105,710 |

**Recommendation: do not rebuild the concept now.** Option A spends about 100 unbilled hours, and the owners would see
almost no difference: same pages, same look, still demo data. Pitch with the static site. If the family says yes,
Option B becomes the paid engagement, and the Next.js port is folded into it rather than paid for twice.

The one case for starting sooner would be a reusable grocer or retail template that Trinovata resells. That is not
recorded as a goal anywhere, so it is Gregg's call.

## 1. Why this is on the table

ChatGPT wrote a directive that Gregg pasted on 2026-10-28; it recommends Next.js, shadcn/ui and React component
libraries. Today's site is static and has no dependencies at all. It was built from 22 to 28 October: 12 commits over
4 active days (`git log`). The stack question is real because the next stage of this site needs a server. The portal,
HR console and KYC uploads only become useful with accounts, a database and private file storage, and a static site
can't provide those. Swapping components alone doesn't justify the move. A backend does.

## 2. What the rebuild has to reproduce

| Surface | Today | Size | Becomes |
|---|---|---|---|
| Home (Grand Entrance) | `tools/grand-entrance/` builds `index.html`; camera in `assets/js/grand-entrance.js`, physics in `assets/js/living.js` | 66 KB SVG; 304 + 446 lines | `app/page.tsx` (server) plus one client component |
| Public pages ×5 | departments, specials, wholesale, locations, about; `site.js` | 327 lines | `app/(site)/…` |
| Careers ×4 | `careers/{index,job,apply,me}`; `careers.js` (5-step application) | 613 lines | `/careers`, `/careers/[jobId]`, `/careers/[jobId]/apply`, `/careers/me` |
| HR console | `hr/index.html`; `hr.js` | 504 lines | `/hr` |
| Store admin | `admin/index.html`; `admin.js`: specials, Instagram post maker, stores and hours, staff notices, publish | 989 lines | `/admin` |
| Employee portal ×7 | `portal/*`; `portal.js` | 489 lines | `/portal/…` |
| Design options | `options/{index,a,b,c}`, styles and scripts inline | 2,867 lines | `public/options/`, unchanged |
| Data | `data/seed.js` (15 collections), `store.js` (localStorage, `sfb-data-v1`) | 438 + 221 lines | `lib/seed.ts` (typed), `lib/store.ts` |
| Shared UI | `ui.js`: `esc`, `seal`, icons, dates | 396 lines | `components/` |
| Styles | 8 files; tokens in `tokens.css` | 1,587 lines | `app/globals.css` with Tailwind `@theme` |

## 3. Target stack

Versions are from `npm view`, run 2026-10-28:

- `next` 16.4.3 (needs Node ≥ 20.9; use Node 24 LTS on Vercel)
- `react` 19.3.1
- `tailwindcss` 4.3.3
- `shadcn` CLI 4.23.0

`motion` 14.7.1 exists, but this plan doesn't use it. The approved direction is hand-written motion with no libraries
(`DESIGN.md`, Brand logic).

shadcn copies MIT components into the repo. They pull in Radix UI (or Base UI) primitives, `lucide-react`,
`class-variance-authority`, `clsx`, `tailwind-merge` and `tw-animate-css`.

**What maps where:**
- **Forms** (application, wholesale, leave, admin editors): Field/Form, Input, Textarea, Select, RadioGroup, Checkbox,
  and Calendar with Popover for dates.
- **HR**: the applicant drawer is a Sheet; the KYC flag reason and the shift-swap request are Dialogs.
- **Lists**: tables are Table (TanStack Data Table only if sorting is needed); admin sections are Tabs.
- **Feedback**: statuses are Badge, still with a text label per `DESIGN.md`; toasts are Sonner.
- **Stepper**: shadcn has none, so the existing hand-built stepper becomes a component.

**Left out** (licences verified in the gap map):
- cosscom/ui: AGPL-3.0.
- react-bits: Commons Clause.
- vercel/ai-elements: deprecated at the end of November 2026.
- Kokonut Pro and magic-mcp: paid tier and API key.

## 4. Where shadcn's defaults break the design law

Each of these is overridden in phase A1. None of them can be left at the default.

- **Background.** shadcn's background is white. `DESIGN.md` says never pure white: use `--cream` `#FFF8F1` and
  `--flour` `#FFFDFA`.
- **Fonts.** create-next-app ships Geist. Use Caprasimo, Atkinson Hyperlegible Next and Alfa Slab One through
  `next/font`. A0 confirms that Atkinson Hyperlegible Next is in `next/font`'s list.
- **Cards.** shadcn cards use `rounded-xl` and `shadow-sm`. The law is a 1 px warm border and almost no shadow.
- **Motion.** Open and close animations from `tw-animate-css` stay within 150–250 ms ease-out, and each gets a
  `motion-reduce:` variant.
- **Contrast.** Focus rings and muted text are re-checked at 4.5:1 against the new surfaces with the existing contrast
  scan.
- **Banned styles.** QA greps for glass blur, gradient text and side-stripe borders.

## 5. The hard parts

1. **React must not own the living scene.** `living.js` rewrites `rotate()` and path `d` attributes about 60 times a
   second, and React would overwrite them on any re-render. The plan:
   - Keep `make-scene.js` as a build step that emits the SVG string.
   - Render that string once with `dangerouslySetInnerHTML`. It is trusted markup from our own generator; this is the
     only permitted use, and lint bans it everywhere else.
   - Port `living.js` and `grand-entrance.js` to TypeScript without changing what they do.
   - One client component starts them in `useEffect` and stops them on unmount.

   The server render is the still pose, which is also the reduced-motion frame, so those visitors see the right
   picture before any JavaScript loads.
2. **localStorage under server rendering.** The server has no localStorage. The store becomes a hook on
   `useSyncExternalStore` that uses the seed as its server snapshot. Without that, every app page throws hydration
   warnings.
3. **Escaping.** React escapes text by default, so the `SFBUI.esc()` rule becomes "no `dangerouslySetInnerHTML`
   except the scene", enforced by lint.
4. **Keep the live alias safe.** The owners see southern-food-basket.vercel.app. The rebuild deploys to a separate
   Vercel project, previews only, until parity passes. Switching production is Gregg's deploy.
5. **Old links keep working.** `*.html` URLs such as `/careers/job.html?id=…` redirect to the new routes through
   `next.config` or `vercel.ts`.
6. **Private files can't leak.** Next serves only `public/`. `docs/`, `SITE.md` and `tools/` stay off the site even
   without `.vercelignore`, which is an improvement on today.

## 6. Option A: port the concept

Still a clickable mock with demo logins and nothing stored or sent.

| Phase | Hours | Done when |
|---|---|---|
| A0 Baseline and setup: Lighthouse and screenshots of the live static site; Next 16, Tailwind 4, shadcn init, fonts, lint rules, separate Vercel project | 3–5 | Baseline report saved; blank app builds and previews |
| A1 Tokens into `@theme`; shadcn variables mapped to `DESIGN.md`; section 4 overrides | 4–6 | A token page renders every pair; the contrast scan passes |
| A2 Public shell (utility bar, masthead, nav band, ribbon, footer and disclaimer) and app shell (sidebar, demo banner); typed seed; store hook; demo role guard | 6–10 | Every route renders its shell; the guard redirects without a session |
| A3 Public pages ×5; `PriceSeal` component | 8–12 | Specials branch filter and wholesale enquiry work as today |
| A4 Grand Entrance home: scene build step, camera and living layer as one client component | 10–16 | Side by side with the live site at 375/910/1280: same pose, same motion; still under reduced motion |
| A5 Careers: roles, role detail, 5-step application with autosave and local-only KYC preview, applicant dashboard | 10–14 | A full application persists through a reload; the store holds metadata only |
| A6 HR console: pipeline, applicant Sheet, verify/flag, roles table, compliance | 8–12 | Moving a card and flagging a document show up on the applicant dashboard |
| A7 Store admin: specials, post maker, stores and hours, notices, publish | 10–14 | A published special appears on `/specials` |
| A8 Employee portal ×7: login, home, schedule and swap, leave, payslips (printable), docs, profile | 8–12 | Leave request and payslip print work as today |
| A9 Options A–C copied to `public/options/`; portal links repointed | 1–3 | Chooser and side-by-side toggle work |
| A10 QA and parity: screenshot diff, contrast, reduced motion, keyboard, Playwright smoke of the three journeys, Lighthouse against the A0 baseline | 10–14 | All pass. This also produces the before/after the gap map lists as missing |
| A11 Preview deploy, `.html` redirects, private-path 404 check, handover notes | 2–4 | Preview URL loaded and checked |
| **Total** | **80–122** | |

## 7. Option B: make it real

This is Option A without A9 (the options pages are a pitch device), plus:

| Phase | Hours | What it adds |
|---|---|---|
| B1 Accounts and roles | 12–16 | Real sign-in for applicants, staff, HR and admin, with role checks on the server rather than in the browser |
| B2 Database and row-level security | 14–20 | Jobs, applicants, stages, notes, messages, employees, leave, specials, stores, announcements; seed migration |
| B3 KYC document vault | 14–22 | Private storage, short-lived signed links, type and size checks, an access log, retention and deletion |
| B4 Admin publishes for real | 8–12 | Image upload; specials go live with cache revalidation |
| B5 Notifications | 4–6 | Status emails to applicants, alerts to HR |
| B6 Security review | 6–10 | Auth and RLS tests, upload abuse, an OWASP pass (`security` agent) |
| B7 Privacy notice and consent wording | 3–5 | Drafts for the owners and counsel to approve |
| B8 Real content and training | 6–10 | Owner-supplied jobs, hours and photos (`docs/shotlist.md`); a staff walkthrough |
| B9 Local search | 4–6 | Store schema per branch, sitemap, Google Business Profile links |
| **Added** | **71–107** | **Production total 150–226** |

**Not included:**
- **Payroll.** Real payslips need the company's payroll system, which is unknown; quote it after discovery.
- **Online shopping.** The PRD has no checkout.
- **Photo and drone shoot.** Subcontracted and quoted separately, as `menu.mjs` does for `photo-shoot`.
- **Any AI assistant.**

**Running costs:**
- The house menu carries hosting at 20 USD/month and the domain at 15 USD/year.
- A database, storage and email provider come on top. Pick them from the Vercel Marketplace and price them at signup;
  they are not quoted here.
- Vercel's free Hobby plan is for non-commercial use, so a live business site needs a paid plan.

**The legal question B cannot settle.** The application collects government ID, BIR and NIS numbers, a Certificate of
Character and bank details. Keeping those makes the business the holder of sensitive personal data. Trinidad and
Tobago's Data Protection Act, 2011 is understood to be only partly in force; that is general knowledge and was not
checked in this session. B3 and B7 build the mechanism. The owners and their counsel decide retention, who can see
what, and the consent wording before a single real document is collected.

## 8. How the cost is worked out

The formula is `TTD = hours × 20 USD × 8 (FX) × markup`. Each of those comes from `RATES` in `menu.mjs`:

- **Rate.** 20 USD/h is Gregg's time at cost.
- **Markup.** 2.5× is the floor, a 60% gross margin; list is 3.0×. Customer-facing ballparks are shown ±20%.
- **Client factor.** The "involved" factor (×1.2: several stakeholders, assets still to gather) is a reasonable
  default for a family business that is still gathering its assets after a recent bereavement. It is internal and never shown to the client
  (`menu.mjs`). Gregg decides.
- **Cross-check.** `buildQuote()` was run on the production scope. The menu has no item for an employee portal or a
  document vault, so those ride on `integration-custom` ×2.
- **What agreement proves.** The two methods agree within 3% at the midpoint (188 h against 183 h), but both rest on
  judgement inputs.
- **No market anchor yet.** `finance/rate-card.md` §0 records Juniper House at 3,000–5,000 TTD for a brochure site.
  Option B's list price (88,152) is 18–29× that because it is a platform, not a brochure, and nobody has tested
  whether a south Trinidad grocer will pay it.
- **Not modelled.** Claude usage cost.
- **Phasing.** If the price is the obstacle, `buildPhasedQuote()` can split it. For example, phase 1 is the public site
  and live applications; phase 2 is HR, the portal and the document vault.

## 9. Risks

- **The approved look regresses.** v4 is the version Gregg deployed for people to see. Mitigation: screenshot parity at
  375/910/1280 against the live static site before anything replaces it.
- **Dependency upkeep.** Dozens of packages, a Next major roughly every year, and Node versions retiring on Vercel
  (Node 20 is deprecated from 1 October 2026). The static site has none of this.
- **The motion direction drifts.** It stays hand-written and Motion is not added. If a later session reaches for a
  library, that is a design-law change and must be recorded in `DESIGN.md` first.
- **Hours spent before a yes.** Option A is about 100 unbilled hours on a concept the business has not asked for.
- **Sensitive data.** Option B only; see the legal paragraph in section 7.

## 10. Decisions for Gregg

1. Stay static (recommended), Option A now, or Option B as the engagement.
2. If B: the client factor (normal or involved), and whether to phase it.
3. If B: the owners and counsel own the KYC retention and consent policy; agree that before quoting B3.
4. Options A–C: carry them into the rebuild or archive them once the home is chosen.
5. Backend provider. Supabase is what TradeLynq already runs on, through the Marketplace; one stack is cheaper to
   maintain than two.

## 11. When to come back to this

- **The owners respond well or ask for a price.** This plan is the scope for the SOW. Run the `new-client` skill to
  open `Dev/Clients/<name>`, then generate the paperwork from `finance/docs.mjs` with the same item ids
  `tools/rebuild-cost.mjs` uses.
- **The pricing ledger has three or more delivered jobs.** Re-run `node tools/rebuild-cost.mjs`, and check the hour
  ranges in sections 6 and 7 against what the ledger proposes.
- **Someone proposes adding a React library to the static site.** It can't be done without this rebuild; point them
  here.

## 12. Port log (Option A, started 2026-10-28)

Gregg chose Option A after reading this plan. The work is on branch `next-rebuild`, in the worktree
`.claude/worktrees/next-rebuild`. Preview locally with the `sfb-next` entry in `Dev/.claude/launch.json` (port 4176).

**How the old CSS is carried over (A1).**
- There are two root layouts. `app/(home)` loads only `styles/home.css` and has no Tailwind at all.
  `app/(sfb)` loads Tailwind, shadcn and the other ported stylesheets. Crossing between them is a full page load, as
  it is on the static site. `app/global-not-found.tsx` serves unmatched URLs.
- `tools/port/scope-css.mjs` generates `styles/*.css` from `assets/css/*.css`:
  - The home sheet is scoped under `body.ge-root`.
  - Each page sheet is scoped under `:where([data-css~="<name>"])`, which adds no specificity.
  - A `<Scope css={[…]} page="…">` wrapper with `display: contents` stands in for the old `<body data-…>`.
  - Dialogs and sheets portal into the Scope, so page CSS still reaches them.
- Cascade layers: Tailwind's preflight sits in `base`, the ported CSS sits in `components`, and utilities beat both.
  Preflight wipes the browser defaults the old CSS relied on (link underlines, bullets, heading sizes, form fonts), so
  `globals.css` restores them property by property. Elements that shadcn owns (`[data-slot]`) and Sonner are left out.
- The shadcn components were rewritten to emit the old class names (`.btn`, `.badge`, `.card`, `.panel`, `.drawer`,
  `.tabs`, `.table-wrap`, `.field`, `.toast`). Base UI supplies the behaviour: focus trap, portals, aria and the toast
  queue. The look has one source, the ported CSS.

**Departures from section 3.**
- Selects, date fields, checkboxes and radios stay as native controls, as they are on the live site.
  - The reasons: parity, the system date picker on phones, and older shoppers who know these controls.
  - Removed: the shadcn Select, Popover, Calendar, Checkbox, RadioGroup and Separator.
  - Uninstalled: `lucide-react`, `next-themes`, `react-day-picker` and `date-fns`. The icons stay the hand-drawn set
    from `ui.js`.
- Toasts call Sonner with a class (`toast-ok`, `toast-bad`), not `toast.success`/`toast.error`. Those add an icon the
  old toasts never had.

**Traps found (each is fixed; keep them in mind for the page tracks).**
- **`--muted` means two things.** shadcn uses it as a background; `tokens.css` uses it as the muted text colour.
  shadcn's unlayered `:root` won, and every lede and hint went near-invisible. `globals.css` now maps shadcn's
  `--color-muted*` straight to brand tokens and never redefines `--muted`.
- **Tailwind generates utilities for some legacy class names.** It generates `container`, `grid` and `grow`, and the
  utilities layer beats the ported rule (`.container` lost its gutter). `@source not inline(…)` blocks them. Re-run
  `node tools/port/tw-collisions.mjs .` after porting more markup.
- **A Base UI portal with `container={null}` waits forever.** The Scope context is `undefined` outside a Scope (portal
  to `body`) and `null` only before its node mounts.
- **The dev watcher misses some edits.** On this machine `C:\Users\Gregg\Dev` is a junction to `D:\Dev`, and the
  Turbopack watcher missed CSS edits. Restart the dev server to see stylesheet changes.
- **`next/font` has no metrics for Atkinson Hyperlegible Next.** It uses `adjustFontFallback: false`, and the dev
  warning about it is expected.

**The shared layer (A4).** Page tracks build on these and do not reinvent them.
- `lib/store.ts` replaces `store.js`. The keys, the version guard and `reset()` are unchanged, so a browser's demo data
  carries across.
  - Pages read through `useData()` and `useSession()`. The server and the first client render see the seed, and the
    browser's own copy replaces it after hydration.
  - Read helpers take the data as their first argument (`jobs(d, …)`, `applicantsFor(d, id)`), so they work on what
    the hook returned. Write helpers (`setStage`, `requestLeave`, …) load, clone, save and notify every subscriber.
  - A change in another tab arrives through the `storage` event.
- Anything that reads the clock or the session waits for `useHydrated()`. Next refuses `new Date()` while
  prerendering a client component, and the session only exists in the browser. `todayHours(b, null)` falls back to the
  Mon–Sat row.
- `useRequireRole([…])` guards each portal page. It renders nothing until hydrated, then sends anyone without the role to
  `/portal?next=…` with the query and hash kept. The login page must pass `next` through `safeNext()`, which allows only
  paths on this site. It parses the value rather than matching a pattern, because the URL parser drops tabs and
  newlines and resolves `/.//`, and either can turn a path into a link to another site. The login page also keeps
  `portal.js`'s role-area check (`ROLE_AREA`), so an applicant's `next` cannot open `/hr`.
- The page chrome is `SiteFrame` (public and careers pages) and `AppShell` (portals). Their markup is the old markup;
  19 measured metrics each match the live `specials.html` and `hr/index.html` at 1280 px.
- In `AppShell`, the HR and admin tab links (`/hr#roles`) are plain `<a>`, so `hashchange` fires as the old tab code
  expects. Links to other pages use `next/link`.
- Lint enforces the input rule: `react/no-danger` is an error. Raw HTML is allowed only for the generated home scene and
  the fixed `js` class script, each with a disable comment. `no-img-element` is off: the photos are pre-sized WebP
  inside the ported `.pic` boxes, and `next/image` adds wrappers that CSS was not written for.

**The home page (A5).**
- `app/(home)/page.tsx` server-renders everything the old script filled in with `innerHTML`: the ticker, shelf,
  departments, store cards, route map, socials and footer stores. Like `window.SFB_DATA`, it reads the seed only, never
  a browser's edited copy. Only "Today …" and "Open now" wait for hydration (`StoreToday`), because they read the clock.
- Behaviour is ported line for line into two modules. `lib/home/entrance.ts` holds the camera, menu, nav spy, shelf,
  department layouts and carousel (from `grand-entrance.js`). `lib/home/living.ts` holds the flags, crew, bunting,
  seals and reveals (from `living.js`).
  - `components/home/home-live.tsx` starts both after hydration. Its cleanup stops every listener, frame, timer and
    observer, so React's strict-mode double effect leaves nothing behind.
  - Reveal CSS is gated on `html.lv`, so stopping leaves the page fully visible.
- Markup the scripts used to inject is now server-rendered: the headline word masks (`.wm`), the nav ink pill, the
  carousel dots, the menu's `--i` delays and the bunting host. The scripts only add classes and draw.
- The scene. `npm run scene` runs `make-scene.js` and writes `app/(home)/scene.ts`. The SVG is byte-identical to the
  static `scene.svg` except for two image paths, which are now root-relative.
  - `FIRST_FRAME` (`lib/home/camera.ts`) turns the camera's opening-shot maths into an inline script. It rides inside the
    scene's HTML, so it runs as the page parses and sets the opening viewBox before first paint.
  - React never sees it as a `<script>` element. React will not run a script it renders on the client and logs an
    error (seen during Fast Refresh), and this placement avoids that.
- Parity, checked 2026-10-28: live v4 against `localhost:4176`, 15 page regions at 1280 px.
  - Matches: text (whitespace aside), element counts, attributes, and classes after the living layer has run.
  - Differences: the new URLs (`/careers` for `careers/index.html`, root-relative assets) and the seal SVG's
    `class="seal-bg"` and `focusable="false"` from the shared `PriceSeal`. Both layouts' CSS give that SVG the same box.
  - Behaviour: same camera viewBox at the top and mid-entrance, at 1280 and 375 px. The shelf arrow scrolls 4 → 1084 px
    on both, and the carousel and menu behave the same. Neither page overflows at 375 or 910 px.
  - Not run: reduced motion, which the browser tools cannot emulate. All eight reduced-motion branches are carried over
    line for line.

**The design options (A9).** `options/` moved to `public/options/` unchanged, apart from links.
- Page links point at the new routes (`/specials`, `/careers#roles`, `/hr`, …). Asset links stay relative and resolve
  under `public/`. The switcher's Main entry is now the site root instead of `index.html`.
- They still read `window.SFB_DATA` from `/data/seed.js`. That URL is now a route handler (`app/data/seed.js/route.ts`)
  that prints `lib/seed.ts`, so there is still one seed. It makes the 8 image paths relative again, because these pages
  prefix them with `../../`. Like the home page, they show the seed, never a browser's edited copy.
- Checked 2026-10-28 on `localhost:4176`: all four pages load the seed, no image is broken, and every asset link
  answers 200.

**The page tracks (A3, A6–A8; careers).** Five tracks ran in parallel, each in its own folders, and were reviewed,
checked in the browser and committed one at a time: public pages `646a451`, HR `7b3a46a`, portal `f8502ba`, careers
`f9d2b5f`, admin `efb80d6`. Anything that depends on the session or the browser's copy of the data renders after
hydration; the server render shows the seed. Departures, each kept small on purpose:
- Public: the specials page shows every deal on first paint until the query is read. There is no popstate listener,
  as in `site.js`; the URL writes use `replaceState`, so they add no history entries.
- Careers: KYC previews use object URLs instead of `FileReader`. The "Application submitted" toast is raised by
  `/careers/me` from `?submitted=1`, which it then removes. The roles board shows every role until the query is read.
- HR and admin: the drawer is the shared Sheet, which exists in the DOM only while open (the static page kept it with
  `aria-hidden` and `inert`); Base UI traps focus instead of the old Tab wrap. `<main>` keeps the shell's id
  `app-main` (static: `hr-main`, `admin-main`); nothing targets either. Admin closes the off-canvas sidebar by
  clicking the shell's menu button, because the shell owns that state.
- Admin, on purpose: the publish panel's hand-off file is now `seed.ts` in `lib/seed.ts`'s shape, and its copy names
  that file. A `window.SFB_DATA` script would hand the web team a file this build never reads.
- Portal: sign-out navigates to `/portal` first and the sign-in page ends the session, because logging out while a
  portal page is mounted wakes its role guard. The document input is remounted after each upload.
- Dev only: `router.refresh()` and Fast Refresh rewrite the address to Next's own copy of it, which drops a hash set
  through `location.hash`. The app never calls `refresh()`, and real clicks and keys keep the hash.

**Old addresses (A11, first half).** `next.config.ts` redirects the static site's `.html` addresses with 307s, so
the alias can still be pointed back at the static site. The query passes through, so `?dept=` and `?next=` keep
working.
- `job.html?id=` and `apply.html?id=` go to `/careers/[id]` and `/careers/[id]/apply` only when the id is slug
  characters. Anything else goes to `/careers`. The old `?id=` stays on the new address; the pages ignore it.
- `/options` and `/options/a|b|c` go to their `index.html`, because `public/` serves files, not folders, and the
  pages' relative links need the `/options/` base that Next's trailing-slash redirect would drop.
- Checked with curl on 2026-10-28:
  - Every old address answered 307 to its route.
  - `?id=..%2Fhr`, `?id=x%2F%2Fevil.com` and `?id=JOB` fell back to `/careers`.
  - `/portal/evil.html` gave 404.
  - `/SITE.md`, `/docs/…` and `/tools/…` gave 404.

**The static site removed.** The HTML pages, `assets/css/`, `assets/js/`, `data/seed.js` and the old home template are
deleted, along with their lint ignores. The image provenance note moved from `assets/img/SOURCES.md` to
`docs/SOURCES.md`, so the site no longer serves it.

**Departure: the skip link.** The old rule hides it with `top: -100px` inside the header. Below a tall demo banner
(209 px on a phone) that still leaves it on screen. The live site has the same bug: at 375 px on `careers/index.html`
it sits at top 108.8 px. `tokens.css` now clips it until it has focus. **The same fix is still owed on `concept-v1`.**

**Left as it is for parity, to revisit after A10.** These are kept exactly as they were and are not new choices:
- The ported CSS keeps `#fff` text on dark bands.
- The home header and the app top bar keep `backdrop-filter: blur(10px)`.
