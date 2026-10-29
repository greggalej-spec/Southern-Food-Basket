# Southern Food Basket: overnight report, 29 Oct 2026

## Where it is

- Branch `next-rebuild`, commit `b2cc915`, pushed. `main`, `concept-v1`, the public static alias and trinovata.com are untouched.
- Preview (sign in to Vercel first): https://southern-food-basket-next-ccic4vsin-greggs-projects-fbe529a0.vercel.app/tour
- On your machine: in the `next-rebuild` worktree, `npm run dev -- --port 4176`, then http://localhost:4176.
- How to use it: `docs/GUIDE.md`. Start at **`/tour`**.

## What you asked for, and where it is

| You asked for | What exists now | Where |
|---|---|---|
| A guided experience | Eight chapters. Each signs in as the person who does that job, opens the real page and rings the control to try. | `/tour` |
| Promotions and promo codes | Marketing drafts an offer; someone else approves it. One code per shopper per offer, stored as a hash, limited to stores and dates. The till check gives a reason for every refusal and locks after five misses. | `/offers`, `/admin#promos`, `/admin#codes`, `/portal/till` |
| E-mail collection and newsletter management | Double opt-in, a consent record, preferences, one-click unsubscribe. Campaigns are built from the specials and go only to confirmed subscribers. Marketing sees masked addresses; the owner's office can export, and the export is logged. | sign-up on `/specials`, `/newsletter/*`, `/admin#newsletter` |
| An internal and an external newsletter | Staff updates (internal): pick stores and teams, ask staff to confirm they read it, remind only the people still waiting. The weekly e-mail above is the external one. | `/admin#staffnews`, `/portal/updates` |
| HR easier and kinder; "AN UPDATE", then open it | Plain stages that say how long each usually takes. HR's Decision step previews the applicant's letter. The applicant gets an "update" e-mail and a sealed card that looks the same for an offer or a "not selected". | `/careers`, `/hr#pipeline` |
| Strict data and access | Grants by person, role, stores and end date; revoke and restore with a reason; an audit log. Every write re-checks the grant when it runs. Staff, member and mailing data never reach the public pages (0 of 16). | `/admin#access`, `/admin#audit` |
| An admin that works, not AI slop | It opens on **Today**: what this person has to do, worked out from their own access. The menu shows only what their job uses. | `/admin#today` |
| A price bracket well above today | The value and pricing brief. | `docs/plan/value-ladder.md` |

## The price, briefly

All TTD list prices, computed by `quote.mjs` from hour estimates that no ledger has calibrated yet.

| Rung | List | 36 months with care |
|---|---|---|
| 1. Shopfront | 39,192 | 2,404/mo |
| 2. + Careers and HR | 76,248 | 4,716/mo |
| 3. + Marketing engine | 101,400 | 5,519/mo |
| 4. Operations platform | 116,760 | 8,650/mo (311,394 over the term) |

The brief's advice: offer rungs 1 and 2 first, then phase in 3 and 4. As a mock with no backend it already prices at 38,400–58,560 list: three to four times a house brochure site.

## Checked overnight

- `tsc` and `eslint` clean; `next build` prerenders 53 pages.
- Data check after the build: 0 of 16 public routes carry staff, member or mailing data.
- Tests: promotion rules 12/12, subscriber history pass, CSV export 8/8.
- All eight tour chapters walked in the browser.
- 375, 910 and 1280 px: no horizontal overflow. Every contrast pair checked is at least 5.65:1.
- Preview deploy of `b2cc915`: Vercel built 53 of 53 pages with no errors, marked it READY, and gave it the preview target (not production). The URL redirects to Vercel login (HTTP 302); the old short alias still returns 404, and the public static site still returns 200.

## Needs your call

1. **Pricing code is unmerged.** `menu.mjs`, `quote.mjs` and the active rate card sit on Trinovata-Docs branch `worktree-pricing` (86adb77). Merge it, or record it as canonical, before a quote cites it. Its `buildPhasedQuote()` puts repeated items all in the first phase; fix that before a phased quote.
2. **The PRD's "Confirmed" decisions.** DEC-001 to 017 cite a "Website design feedback session", but there is no client record. Who was that session with?
3. **Done, at your yes: the demo store admin is now "Ria Seecharan".** She had shared the owners' family surname. The rename covers both branches: the rebuild and the static site on `concept-v1`. Her brother, the emergency contact, is now Vikash Seecharan. The seed version went up (rebuild 9, static 7), so any browser that already ran the demo drops its old copy. The public link updates only when you deploy `concept-v1`.
4. **Media permission.** Still none on record. The brief's first contact step is gentle, given the bereavement, and leads with careers.

## On purpose, not bugs

- The tour and the shopper sign-in hint show the demo codes and Marisa's demo address, so a viewer can play without typing.
- Marsha (store admin for Princes Town only) has no sign-in card. The staff-updates chapter signs in as her.
- Every rule runs in the browser, which a visitor can edit. Production moves them to the server, against a database with row-level security. The brief lists this under "Must become real".

## Not done, or not verified

- The CSV export was tested by script, not clicked: a click downloads a file.
- The preview sits behind Vercel login. I confirmed the redirect, not the page behind it.
- The dev-server log still shows old errors (a missing audit panel, `new Date()` during prerender). They come from before the refactor; their stack traces cite line numbers that no longer exist, and the build and the route sweep show none.
- PRD items still unbuilt are listed in the brief, §5.
