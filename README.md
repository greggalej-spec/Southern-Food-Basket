# Southern Food Basket — concept site

An unsolicited prototype by Trinovata for Southern Food Basket, a supermarket-and-wholesale business in
south Trinidad. Not affiliated with the company. Every person, job, price, document, phone number and
e-mail in it is demo data; the only sourced facts are listed in `SITE.md`.

## What is in it

| Area | Pages | Notes |
|---|---|---|
| Public site | `index`, `departments`, `specials`, `wholesale`, `locations`, `about` | static, data from `data/seed.js` |
| Hiring portal | `careers/index`, `careers/job`, `careers/apply`, `careers/me` | five-step application with a KYC document step; applicant dashboard |
| HR console | `hr/index` | pipeline board, document review (verify / flag), roles, employee compliance |
| Employee portal | `portal/index` (demo login), `home`, `schedule`, `leave`, `pay`, `docs`, `profile` | demo roles: Applicant, Employee, HR |

No backend. State lives in `localStorage` through `assets/js/store.js`; "Reset demo" in any footer clears it.
KYC "uploads" are previewed in the browser only; the store keeps file name, size, type and dates, never bytes.

## Run

```bash
python -m http.server 4173
```

Then open http://localhost:4173/ . Any static server works; there is no build step.

## Layout

```
assets/css/tokens.css   tokens + primitives (DESIGN.md is the law)
assets/css/app.css      portal / HR shell and components
assets/css/site.css     public pages      assets/css/careers.css · portal.css  section extras
assets/js/store.js      mock data layer   assets/js/ui.js  header, footer, app shell, helpers
assets/js/site.js · careers.js · hr.js · portal.js   page logic
data/seed.js            all demo data (bump `version` when it changes)
assets/img/             hand-authored SVGs; provenance in SOURCES.md
```

## Deploy

Vercel, static. Preview deploys only from this branch (`concept-v1`); production is a human decision.
