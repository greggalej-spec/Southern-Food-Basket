# Southern Food Basket (fact card)

- **What:** concept website + hiring portal with applicant KYC + HR console + employee portal for a real south-Trinidad grocer, built unsolicited. v1 2026-10-22 (modern, own illustrations); v2 2026-10-23 (traditional, real brand) after Gregg judged v1 too modern for older shoppers and millennials; v3 2026-10-24: four homepage designs on one site, the Grand Entrance (animated store-front arrival) as the main home page, after Gregg rejected the v2 home. Badged "Unofficial concept" on every page.
- **Kind:** concept (classification: third-party-media). The logo, product photos and Try Me prices come from the company's own public Instagram, supplied by Gregg on 2026-10-23. No business permission is recorded.
- **Run:** static; `python -m http.server 4175` in the folder (or the `sfb` / `sfb-options` entries in `Dev/.claude/launch.json`, ports 4175 and 4180), open http://localhost:4175/. The home page is generated: edit `tools/grand-entrance/index.template.html` or `make-scene.js`, then `node tools/grand-entrance/build.js`.
- **Deploy:** Vercel project `southern-food-basket` (static, no build), linked in `.vercel/` (gitignored). `.vercelignore` keeps `tools/` and the Markdown out of the upload. The first CLI deploy on 2026-10-23 was assigned the Production target by Vercel, so the public alias exists; the per-deploy URL is behind Vercel login.
- **URL:** https://southern-food-basket.vercel.app (public, noindex; HTTP 200 and rendered in the browser 2026-10-23)
- **Screenshot:** none in the registry yet
- **Status:** live on the Vercel alias (v3 from 2026-10-24); not linked from anywhere
- **Publicity:** Gregg decided on 2026-10-23 to keep the Vercel alias public so he can share the link with the business. That is the only approved use: do not take the alias down, and do not put the concept on trinovata.com/work or social until the business agrees (third-party media, no permission).
- **Repo:** greggalej-spec/Southern-Food-Basket (private) · branch `concept-v1` · Source: `_work.json` slug `southern-food-basket`

## Layout (v3)
- `/` the main design, Grand Entrance (`assets/css/grand-entrance.css`, `assets/js/grand-entrance.js`, scene generator in `tools/grand-entrance/`)
- `/options/` chooser; `/options/a/` The Storefront, `/options/b/` The Weekly Flyer, `/options/c/` Market Day. Each option keeps its own Home; every other link reaches the one shared site.
- One portal for all designs: `careers/`, `portal/`, `hr/`, `admin/`, plus the inner pages (still in the v2 look).
- Switcher on every home (`assets/options-nav/`): a pill that compacts to a sphere, draggable to either bottom corner (remembered in localStorage), with cross-page view transitions.
- Standalone archives of each design, as they were before the merge: greggalej-spec/sfb-option-a-storefront, -b-weekly-flyer, -c-market-day, -d-grand-entrance (private; each carries its own copy of the portal from `5da9a31`).

## Social feeds
- A live Instagram/TikTok feed was built and then removed on 2026-10-24 at Gregg's call: it needs the store's own logins (a Meta developer app with an Instagram professional account; an approved TikTok Display API app). The code is in git history at commit 63b0e6a if the store grants access. The designs keep plain links to the accounts.

## Sourced facts used on the site (verify before any real use)
- Southern Food Basket Limited, Princes Town; key principal listed as Nazim Mohammed — Dun & Bradstreet company profile
- Founded 1998 — Del Risco company record; an exporter directory (ExportersIndia) gives 2000
- Five stores, named in the company's own Facebook post of September 2026 (employee of the month): Couva, Coffee Street San Fernando, Point Fortin, Penal, St Charles Village Princes Town
- Addresses, phone numbers, plus codes, Google place IDs and opening hours (Mon–Sat 7:00 am–10:00 pm, Sun 7:00 am–7:00 pm) — each store's Google Maps listing, read 2026-10-23. Princes Town has two listings 60 m apart (Supermarket on Manahambre Rd; Market Place on St Charles Rd, +1 868-655-8092, Saturday to 8:00 pm); the site uses the Supermarket listing
- Counters (in-house bakery, restaurant, fresh fruit and vegetables, butcher shop, household, pharmacy), head-office phone +1 868-225-4732, WhatsApp channel and TikTok — the company's public Facebook page intro
- Couva store grand opening in California, Couva, dated "09/05/26" on a TikTok screenshot Gregg sent (5 September or 9 May 2026; Couva-tagged posts start 9 September)
- Imports include table potatoes, cabbage, frozen beef, raisins — Panjiva; exporter listing for beans, fresh fruit, frozen meats, vegetables — ExportersIndia
- 25 "1 FOR $x · TRY ME" prices with post dates June–October 2026 — the company's Instagram (`data/seed.js` → `specials`)
- Instagram handle `southernfoodbasket` — listed on the company's Facebook page intro (and in the downloaded file names)

## Demo data (invented, labelled on the site)
Every job, applicant, employee, payslip, rota, leave record, document and e-mail address. Job listings never show pay:
Gregg confirmed the company only discusses pay after the interview (2026-10-23).

## Known gaps
- The KYC document list is drawn from general knowledge of Trinidad and Tobago hiring paperwork and must be confirmed with the business.
- Prices are as posted months ago; a real build would need a price feed or a staff studio to post deals.
