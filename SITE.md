# Southern Food Basket (fact card)

- **What:** concept website + hiring portal with applicant KYC + HR console + employee portal for a real south-Trinidad grocer, built unsolicited. v1 2026-10-22 (modern, own illustrations); v2 2026-10-23 (traditional, real brand) after Gregg judged v1 too modern for older shoppers and millennials. Badged "Unofficial concept" on every page.
- **Kind:** concept (classification: third-party-media). The logo, product photos and Try Me prices come from the company's own public Instagram, supplied by Gregg on 2026-10-23. No business permission is recorded.
- **Run:** static; `python -m http.server 4175` in the folder (or the `sfb` entry in `Dev/.claude/launch.json`), open http://localhost:4175/
- **Deploy:** Vercel project `southern-food-basket` (static, no build), linked in `.vercel/` (gitignored). The first CLI deploy on 2026-10-23 was assigned the Production target by Vercel, so the public alias exists; the per-deploy URL is behind Vercel login.
- **URL:** https://southern-food-basket.vercel.app (public, noindex; HTTP 200 and rendered in the browser 2026-10-23)
- **Screenshot:** none in the registry yet
- **Status:** live on the Vercel alias (v2); not linked from anywhere
- **Publicity:** Gregg decided on 2026-10-23 to keep the Vercel alias public so he can share the link with the business. That is the only approved use: do not take the alias down, and do not put the concept on trinovata.com/work or social until the business agrees (third-party media, no permission).
- **Repo:** greggalej-spec/Southern-Food-Basket (private) · branch `concept-v1` · Source: `_work.json` slug `southern-food-basket`

## Sourced facts used on the site (verify before any real use)
- Southern Food Basket Limited, Princes Town; key principal listed as Nazim Mohammed — Dun & Bradstreet company profile
- Founded 1998 — Del Risco company record; an exporter directory (ExportersIndia) gives 2000
- 99–101 Coffee Street, San Fernando — Panjiva shipment records; tntyellow listing
- 229B St Charles Junction, Princes Town — Trinicompass listing
- S.S. Erin Road, Penal–Debe — Mapcarta listing
- Couva store — location tag on the company's Instagram posts of September and October 2026 (street address not found)
- Imports include table potatoes, cabbage, frozen beef, raisins — Panjiva; exporter listing for beans, fresh fruit, frozen meats, vegetables — ExportersIndia
- 25 "1 FOR $x · TRY ME" prices with post dates June–October 2026 — the company's Instagram (`data/seed.js` → `specials`)
- Instagram handle `@southernfoodbasket` — inferred from the downloaded file names; not opened or verified

## Demo data (invented, labelled on the site)
Opening hours, phone and WhatsApp numbers, e-mail addresses, services at the three directory branches, every job,
applicant, employee, payslip, rota, leave record and document.

## Known gaps
- The KYC document list is drawn from general knowledge of Trinidad and Tobago hiring paperwork and must be confirmed with the business.
- Prices are as posted months ago; a real build would need a price feed or a staff studio to post deals.
- Couva street address unknown.
