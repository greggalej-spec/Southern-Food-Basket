# Integration inventory: Southern Food Basket concept site

S0 audit file 3 of 5. Written 2026-10-28 for PRD section 27.1 (`docs/prd/SFB-PRD-001.md:1156`). The table in section 1 is the PRD 18.4 inventory (`SFB-PRD-001.md:820-834`) filled in with what the repo holds. Branch `concept-v1`, HEAD `aa5a7f8`.

## 0. How to read this

- Every claim has a `path:line` or a command and its result. "Not found" means a search returned nothing; it does not prove the thing is absent from systems outside the repo.
- Environment variable values were never printed. Only names appear here.
- Not checked: the Vercel dashboard (Vercel CLI is not installed on this machine), the GitHub repo settings, any Google, Meta or TikTok account. Anything that lives only there is marked "not checked".
- Searches used: `grep -rn "fetch(\|XMLHttpRequest\|sendBeacon"` over `*.js` and `*.html` outside `docs/`, `.git/` and `tools/` returned 0 matches. So no page code calls any network service. The only outbound traffic is the browser loading fonts, images and links the user clicks.

## 1. PRD 18.4 table, filled in

| System (PRD 18.4) | PRD status | What the repo has | Evidence | Still needed |
|---|---|---|---|---|
| Existing source repository | Unknown | One GitHub repo, `greggalej-spec/Southern-Food-Basket`, private. Branch `concept-v1`, 10 commits. No `.github/` folder, so no CI. The site was built unsolicited, so the company has not named an authoritative repo (Q1 stays open). | `SITE.md:11`; `cmd: git remote -v` shows origin on that repo; `cmd: git log --oneline \| wc -l` returns 10; `cmd: ls -d .github` returns "No such file"; `CLAUDE.md:2-3` | Q1: which repo and branch the company treats as authoritative. Whether `main` exists and what it holds was not checked. |
| Existing database/auth provider | Unknown | None. No database. No identity provider. "Sign in" sets a role string in the browser (`sfb-session-v1`). Data lives in `data/seed.js` plus a browser copy in `sfb-data-v1`. | `assets/js/store.js:61-65` (`login`); `portal.js:108-115` (`?as=<role>`); `data/seed.js` sets `window.SFB_DATA`; `cmd: grep fetch(` returns 0 | Everything in PRD 18 and 22 (auth, RLS, audit) is new build. Q7: which identity provider. |
| Vercel deployment | Public URL observed | Static project `southern-food-basket`, no build step, public alias https://southern-food-basket.vercel.app. The first CLI deploy (2026-10-23) was assigned Production by Vercel, so the public alias exists; the per-deploy URL is behind Vercel login. `.vercel/` is gitignored and holds the project link. No `vercel.json`. `.vercelignore` keeps `_capture.html`, `tools/` and `*.md` out of the upload. | `SITE.md:6, 9-10`; `CLAUDE.md:7`; `.vercelignore:1-3`; `cmd: ls vercel.json` returns "No such file" | Project ownership, team, domain and settings: not checked. Deployment Protection state: `cmd: curl -s -o /dev/null -w "%{http_code}" https://southern-food-basket.vercel.app/` returned 200 on 2026-10-28 with no login, so the alias is not behind Vercel SSO. That matches `SITE.md:10`. |
| Email service / Microsoft ecosystem | Undetermined | None. The site sends no email. Only `mailto:` link: the HR drawer shows an applicant email (`hr.js:213`). The `.example` addresses in the settings (`hello@sfb.example`, `careers@sfb.example`) are placeholders. | `assets/js/hr.js:213`; `data/seed.js:18`; `cmd: grep fetch(` returns 0 | Q7, Q8: Microsoft 365 or Google Workspace, sender domain, transactional provider. Message toasts in HR and portal say "sent" without sending (risk-register.md R-20). |
| Maps provider | Undetermined | Google Maps deep links only (section 2). No Maps API, no key, no embed. Option C also draws its own inline SVG map from `lat` and `lng` in the seed (section 2). | `assets/js/ui.js:58-68`; `options/c/index.html:924-950` | Provider choice with cost, terms and fallback (PRD 18.4). Verified coordinates and place ids for the five branches (Q4). |
| Document storage/scanning | Undetermined | None. Uploads are read in the browser as object URLs plus metadata (name, size, type). Files are not stored or scanned. Drafts and metadata sit in localStorage. | `assets/js/careers.js:28-47` (file checks and meta); `careers.js:39` (revokes object URL); `careers.js:209-212` (draft in localStorage); `cmd: grep fetch(` returns 0 | Storage provider, malware scan, retention and deletion design (PRD 18, 22). Q7. |
| Loyalty system | Existing effort mentioned, unverified | Nothing. | `cmd: grep -rniE "loyal\|reward" --include=*.js --include=*.html .` (outside `docs/`, `.git/`, `tools/`) returned no match | Q11: provider and contract. |
| Google Forms | Data reported, not inspected | Nothing. No form embed, no import, no CSV. | `cmd: grep -rn "forms.gle\|docs.google.com/forms"` returned no match | Q12: provenance and consent of the existing records. |
| Payroll and scheduling | Unknown | Demo data only. Shifts, swaps, payslips and leave are invented records in the seed. Nothing connects to a real system. | Shifts at `data/seed.js:298`; the seed header calls every person, job, document, hour, phone and email invented (`data/seed.js:6`; `assets/js/admin.js:940`); swap and leave toasts at `portal.js:246, 297` | Q13: authoritative payroll and scheduling systems. PRD risk "payroll source missing" stays High. |
| POS/coupon validation | Unknown | Nothing. No promo codes, no coupon or redemption model. | `cmd: grep -rniE "promo code\|coupon\|redeem\|redemption"` found one match, a design description ("one coupon block per department") at `options/index.html:146`. No feature code. | Q10 and Q14: whether redemption is in launch scope. |
| Analytics/observability | Unknown | None. No analytics tag, no error tracking, no Web Vitals. `grep` for gtag, plausible, posthog, hotjar, mixpanel and `_vercel/insights` found nothing. | `cmd: grep -rniE "gtag\|googletagmanager\|plausible\|posthog\|hotjar\|mixpanel\|_vercel/insights"` returned no match | Baseline (PRD 18.4): choose a tool, consent approach and an error channel. |

## 2. Maps: how map links are built

| Item | Detail | Evidence |
|---|---|---|
| Directions link | `https://www.google.com/maps/dir/?api=1&destination=<listing, address, Trinidad and Tobago>`. If the branch has `placeId`, adds `destination_place_id`. | `assets/js/ui.js:59-63` |
| View link | `https://www.google.com/maps/search/?api=1&query=<same text>`. Adds `query_place_id` when `placeId` is set. | `assets/js/ui.js:64-68` |
| Query text | `listing` (or "Southern Food Basket") + `address` (or `name`) + "Trinidad and Tobago". | `assets/js/ui.js:58` |
| Home page | Builds the direction link in `grand-entrance.js`. | `assets/js/grand-entrance.js:138` |
| Options A, B, C | Each builds its own copy of the link inline. | `options/a/index.html:536-537`; `options/b/index.html:806`; `options/c/index.html:900` |
| API key | Not found. No `maps.googleapis.com`, no `key=`. | `cmd: grep -rn "maps.googleapis\|key=AIza"` returned no match |
| Embed or JS map | Not found for Google. | Same grep |
| Own SVG map (option C only) | Option C draws a Trinidad outline from a hand-typed coastline array and places pins by converting each branch `lng` and `lat`. It makes no network call. The code comment calls it a "stylised map" (`:923`); no source for the coastline points is recorded. | `options/c/index.html:923-926` (comment, projection, coastline), `:941-950` (`drawMap`, pins), `:635` (markup) |
| Coordinates | `lat` and `lng` are in the seed per branch but read only by option C. | `options/c/index.html:949`; `cmd: grep -rn "\.lat\b"` shows no other reader |
| Plus code | Shown as text on the locations page and in the admin form. | `assets/js/site.js:284`; `assets/js/admin.js:789` |
| "Open now" | Uses the browser clock (`new Date()`), not Trinidad time. Hours rows are Mon to Sat and Sunday only. | `assets/js/ui.js:71-77`; `grand-entrance.js:141-145` |
| Unverified branch data | Addresses come from public directories and are marked unverified. Princes Town has two Google listings 60 m apart. | `data/seed.js:42`; `assets/js/admin.js:939` ("branch addresses come from public directories (unverified)") |

## 3. Social links

| Link | Where it is set | Where it appears | Evidence |
|---|---|---|---|
| Instagram (`@southernfoodbasket`) | `data/seed.js:19`, marked "verify" in the same line | Footer of every inner page; community block on the locations page; options A, B, C (hard-coded in A and C, filled from the seed in B and C) | `assets/js/ui.js:117, 126`; `assets/js/site.js:110-111`; `options/a/index.html:486`; `options/b/index.html:503, 829`; `options/c/index.html:651, 987` |
| WhatsApp channel | `data/seed.js:17` | Locations page ("Deals on WhatsApp" list item); options A, B, C | `assets/js/site.js:288`; `options/a/index.html:343`; `options/b/index.html:504, 830`; `options/c/index.html:652, 720, 988` |
| TikTok, Facebook | `data/seed.js:17` (Facebook "from the Facebook page intro") | Options A, B, C footers only. The main pages do not link them. | `options/a/index.html:487-488`; `options/b/index.html:831`; `options/c/index.html:719, 989` |
| Trinovata credit | Hard-coded in `assets/options-nav/options-nav.js`; mark image `assets/img/trinovata-mark-ondark.png` | Options pages; `about.html` links trinovata.com | `assets/options-nav/options-nav.js:76-80`; `about.html:50` |

The shop's own social URLs were not checked against live accounts (no network browsing done in this audit). The Facebook and WhatsApp links are as typed in `data/seed.js:17`.

## 4. Fonts and external hosts

### 4.1 Fonts

Fonts load from Google Fonts on every page: `https://fonts.googleapis.com/css2?...` in `<head>`, files from `fonts.gstatic.com`. No font file is stored in the repo and there is no `@font-face` rule (`cmd: find . -name "*.woff*" -o -name "*.ttf"` outside `.git` returned nothing). This means every page view sends the visitor's IP to Google. PRD Q3 (brand kit and licensed fonts) is open.

| Set | Families and weights | Pages | Evidence |
|---|---|---|---|
| Main set | Alfa Slab One; Atkinson Hyperlegible Next 400, 600, 700, 800; Caprasimo | 21 files: the 20 deployed pages and the build template `tools/grand-entrance/index.template.html:10`. Pages: home (`index.html:10`), `about.html:10`, `departments.html:10`, `specials.html:10`, `locations.html:10`, `wholesale.html:10`, `options/index.html:10`, all `careers/*`, `portal/*`, `hr/index.html:5`, `admin/index.html:5` | Link lines listed by `cmd: grep -rn "fonts.googleapis.com/css2" --include=*.html` |
| Option A | Atkinson Hyperlegible Next 400-800; Besley 700-900; Yellowtail | `options/a/index.html:12` | same command |
| Option B | Archivo (width 62-125, weight 500-900); Atkinson Hyperlegible Next 400, 700, 800 | `options/b/index.html:12` | same command |
| Option C | Atkinson Hyperlegible Next 400-800; Shrikhand | `options/c/index.html:12` | same command |

CSS tokens for the main set: `--display` Caprasimo (`assets/css/tokens.css:23`), `--ui` Atkinson Hyperlegible Next (`tokens.css:24`), `--price` Alfa Slab One (`tokens.css:25`). The home page also sets a `--slab` variable in `assets/css/grand-entrance.css:10`. Fallback stacks are system fonts, so text still shows if Google Fonts is blocked.

Licence: all families listed are on Google Fonts, which publishes them under open licences. This audit did not open those licence files, so the statement "open licence" is not verified here.

### 4.2 Other external hosts found in page source

| Host | Use | Evidence |
|---|---|---|
| `www.google.com/maps` | Map links (section 2) | `assets/js/ui.js:62, 67` |
| `instagram.com`, `whatsapp.com`, `tiktok.com`, `facebook.com` | Outbound links (section 3) | `data/seed.js:17-19` |
| `trinovata.com` | Credit links | `about.html:50`; `assets/options-nav/options-nav.js:76` |
| `www.w3.org` | SVG `xmlns` strings only, not fetched | `cmd: grep -rn "w3.org"` |
| CDN scripts | Not found. No `<script src="https://...">` on any page. | `cmd: grep -rn "<script[^>]*src=\"http"` returned no match |

## 5. `/api` functions

None now. `cmd: ls api` returns "No such file". One function existed and was deleted.

| Item | Detail | Evidence |
|---|---|---|
| File | `api/social-feed.js`, 64 lines | `cmd: git show --stat 0efaf3d` lists `api/social-feed.js \| 64 ---` |
| Removed in | Commit `0efaf3d`, "Remove the social feed: a live Instagram/TikTok feed needs the store's own logins". Also removed `assets/css/social-feed.css` and `assets/js/social-feed.js`. | `cmd: git log --oneline`; `SITE.md:22` |
| Recoverable at | Commit `63b0e6a` | `SITE.md:22`; `cmd: git show 63b0e6a:api/social-feed.js` works |
| What it did | Called `graph.instagram.com/me/media` and the TikTok Display API (`open.tiktokapis.com/v2/video/list/`). Read env vars `INSTAGRAM_ACCESS_TOKEN` and `TIKTOK_ACCESS_TOKEN`. Answered `connected:false` when neither was set. Cached 15 minutes at the edge. | `63b0e6a:api/social-feed.js:5, 11, 29, 47, 49-56, 62` |
| Why removed | The feed needs the store's own Meta developer app and an approved TikTok Display API app. | `SITE.md:22` |

Environment variables: `.env.local` holds one name, `VERCEL_OIDC_TOKEN` (written by the Vercel CLI). No site code reads it (`cmd: grep -rn "VERCEL_OIDC_TOKEN"` outside `.env.local` found nothing). `.env.local` is ignored by git (`.gitignore:9` holds `.env*`) and returns 404 on the live site (route-map.md section 1).

## 6. Security headers at the host

No `vercel.json`, so the repo sets no custom headers. On 2026-10-28, `cmd: curl -sI https://southern-food-basket.vercel.app/` returned `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=0, must-revalidate`. It returned no Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy or Permissions-Policy (filtered with `grep -iE`). `/data/seed.js` returned the same `Access-Control-Allow-Origin: *` and `Content-Length: 48347`. These headers are platform defaults, not repo settings.

## 7. What this means for the PRD

- The PRD's stack questions (framework, database, storage, email) have a plain answer: there is nothing to migrate. All of PRD 18 is new build.
- Only three external services are touched today: Google Fonts, Google Maps links and social-profile links. None needs a key.
- Four decisions block integration work: Q7 (identity, email, storage providers), Q8 (Microsoft 365 or Google Workspace), Q11 (loyalty provider), Q13 (payroll and scheduling).
