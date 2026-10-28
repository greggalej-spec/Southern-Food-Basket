# Current state: Southern Food Basket concept site

S0 existing-repository audit, written for PRD section 27.1 (`docs/prd/SFB-PRD-001.md:1152-1166`).

- Audit date: 2026-10-28.
- Repo: `D:/Dev/Clients/Sites/Southern-Food-Basket`, branch `concept-v1`, HEAD `aa5a7f8`.
- Other files in this set: `route-map.md`, `integrations.md`, `asset-inventory.md`, `risk-register.md`.

## 1. How to read this file

- `path:line` is a line in the working tree on 2026-10-28. `cmd:` means a command I ran that day and the result I read.
- The working tree is not clean. `cmd: git status --short` listed 18 modified tracked files (README.md, SITE.md, about.html, admin/index.html, assets/js/admin.js, assets/js/site.js, assets/js/ui.js, data/seed.js, departments.html, index.html, options/a, b, c and index, portal/index.html, specials.html, tools/grand-entrance/make-scene.js, tools/grand-entrance/scene.svg) and untracked `docs/`. I describe the code as it is on disk. Line numbers can move if those files change again.
- Not done in this audit: no browser run, no screenshots, no accessibility test, no server started, no build, no deploy. Anything that needs rendering is marked "not tested".
- Correction to the brief: `requireRole()` is in `assets/js/store.js:67-78`, not in `ui.js`.
- PRD blocks WEB-020..026, WEB-030..039, REC-001..012, REC-020..038 and REC-050..068 are bullet lists, not itemised IDs. Their rows below are keyed by block and bullet order (bullet 1 is the first bullet in the PRD block).
- Status values: `Exists (demo)` means it works in the browser with demo data and no backend. `Partial` means some of the requirement exists. `Missing` means not found in the repo. `Blocked: decision needed (Qn)` means PRD section 26.2 question n must be answered first (`SFB-PRD-001.md:1132-1146`).
- PRD question numbers used: Q1 repo and deploy authority, Q2 final decision-maker, Q3 brand kit and fonts, Q4 five branch details, Q5 photo and hero rights, Q6 recruitment fields, retention, statuses, comms, Q7 identity, email and storage providers, Q8 Microsoft 365 or Google Workspace, Q9 special authoring, approval and price policy, Q10 promo codes, Q11 loyalty, Q12 Google Form consent, Q13 payroll and scheduling, Q14 internal features in public launch, Q15 accessibility, privacy and SLA terms.

## 2. Stack, how it runs, how it deploys

| Item | Finding | Evidence |
|---|---|---|
| Stack | Static HTML, CSS and vanilla JavaScript. No framework, no package manager, no bundler. | `cmd: git ls-files` returned 97 files. `cmd: git ls-files \| grep -Ei 'package\.json\|vercel\.json\|\.github\|tests?/\|\.test\.\|\.spec\.\|^api/\|\.yml$'` returned nothing. |
| Pages | 25 HTML files on disk. 23 are served. `_capture.html` is excluded by `.vercelignore`; `tools/grand-entrance/index.template.html` is excluded with `tools/`. | `cmd: find . -name "*.html"`; `.vercelignore:1-3`. See `route-map.md`. |
| Generated file | Only `index.html` is generated. `node tools/grand-entrance/build.js` runs `make-scene.js`, then writes the template plus `scene.svg` into `index.html`. | `tools/grand-entrance/build.js:1-10`. |
| Run locally | `python -m http.server 4175` from the repo root. No build for the site. | `CLAUDE.md:6`, `README.md:23`, `SITE.md:5`. |
| Hosting | Vercel project `southern-food-basket`, static, no build. Public alias https://southern-food-basket.vercel.app. | `SITE.md:6-7`; `.vercel/project.json` (projectName only recorded here). |
| Deploy rule | Preview deploys only from `concept-v1`. Production is a human decision. The first CLI deploy was given the Production target by Vercel, which is why the alias exists. | `README.md:42`; `SITE.md:6`; `CLAUDE.md:7`. |
| Publicity limit | Gregg decided on 2026-10-23 to keep the alias public so he can share it with the business. No use on trinovata.com/work or social until the business agrees. | `SITE.md:10`. |
| Git | Remote `origin` is https://github.com/greggalej-spec/Southern-Food-Basket.git (private per `SITE.md:11`). Branches: `concept-v1` local and `origin/concept-v1`. 10 commits. | `cmd: git remote -v`, `git branch -a`, `git log --oneline`. |
| CI, tests | None. No workflow files, no test files, no lint config. | Same `git ls-files` search as above. |
| Server code | None. `api/social-feed.js` was deleted in `0efaf3d`; it is recoverable from `63b0e6a`. | `cmd: git show --stat 0efaf3d` (deleted `api/social-feed.js`, `assets/css/social-feed.css`, `assets/js/social-feed.js`); `SITE.md:22`. |
| Network calls from page code | None. No `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` or `EventSource` in the site code. | `cmd: grep -rn "fetch(\|XMLHttpRequest\|sendBeacon\|WebSocket\|EventSource"` over html, js, css, svg (excluding `docs/`, `.git`, `tools/`) returned nothing. |
| Live headers | Root returns 200. Of the security headers checked, only `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` is present. No CSP, X-Frame-Options, X-Content-Type-Options or X-Robots-Tag seen. | `cmd: curl -sI https://southern-food-basket.vercel.app/` on 2026-10-28. |
| Indexing | Every deployed page has `<meta name="robots" content="noindex">`. No `robots.txt` or `sitemap.xml` (live `/robots.txt` and `/sitemap.xml` return 404). | `cmd: grep -c 'name="robots" content="noindex'` per file; `cmd: curl` on both paths. |
| Secrets | None tracked. `.env*` is ignored. `.env.local` exists on disk, untracked, and holds one variable name: `VERCEL_OIDC_TOKEN` (value not read or printed). | `.gitignore:9`; `CLAUDE.md:8`. |

### Scripts and data flow

Every inner page loads, in order: `data/seed.js`, `assets/js/store.js`, `assets/js/ui.js`, then one page script (`site.js`, `careers.js`, `hr.js`, `portal.js` or `admin.js`). Evidence: the `<script>` lines in each page, for example `departments.html:31`, `careers/apply.html:21`, `hr/index.html:74`, `admin/index.html:187`.

The home page and options A, B and C are different. They load `data/seed.js` and their own script, and do not load `store.js`. Evidence: `index.html:140-141`, `options/a/index.html:524`, `options/b/index.html:618`, `options/c/index.html:730`. `assets/js/grand-entrance.js` has no reference to `SFBStore` or `localStorage` (`cmd: grep -c "SFBStore\|localStorage" assets/js/grand-entrance.js` returned 0). It reads `window.SFB_DATA` directly (`grand-entrance.js:7`).

Browser storage written by the site code (`cmd: grep -rn "localStorage.setItem\|sessionStorage.setItem" --include=*.js assets`):

| Key | Where set | Holds |
|---|---|---|
| `sfb-data-v1` (localStorage) | `store.js:34`, key at `store.js:6` | The whole data store: specials, branches, jobs, applicants, employees, notices. Overlays the seed. |
| `sfb-session-v1` (localStorage) | `store.js:63`, key at `store.js:7` | `{ role, userId, at }`. The `at` timestamp is never read back. |
| `sfb-apply-draft-<jobId>` (localStorage) | `careers.js:209-211` | Application draft: name, email, phone, home address, date of birth, experience text, document metadata. Cleared on submit (`careers.js:461`). |
| `sfb-banner-dismissed` (sessionStorage) | `ui.js:140` | Demo banner dismissed flag. |
| `sfbx-side`, `sfbx-hinted` (localStorage) | `assets/options-nav/options-nav.js:18, 129, 176` | Position of the design switcher pill. |

A newer `version` in `seed.js` replaces an older local copy (`store.js:21-22`). `SFBStore.reset()` clears every `sfb-*` key in both storages (`store.js:38-46`).

## 3. What each area does today

### Public site (home, specials, departments, wholesale, locations, about)

- Home page (`index.html`, built from `tools/grand-entrance/index.template.html`): a scroll-driven SVG store-front scene that moves the viewBox toward the door, then four sections: deals shelf (the 12 newest by post date, `grand-entrance.js:127`), department cards (six, wholesale excluded, `grand-entrance.js:135`), five store cards with "Today" hours, an "Open now" badge and a Google Maps directions link (`grand-entrance.js:138-148`), and a careers band showing the first three reasons from the seed (`grand-entrance.js:149`). Footer lists the stores as Google Maps links (`grand-entrance.js:150`).
- Specials page: 25 specials from `seed.js:78-104`, filter by department and a "tagged Couva" checkbox, state kept in `?dept=` and `?couva=1` (`site.js:125-173`). No branch filter, no date filter, no detail page.
- Departments page: department cards with a link to `specials.html?dept=<id>` (`site.js:188`).
- Wholesale page: sourced facts, product lines, customer types and an enquiry form. The form validates, then shows "Enquiry noted (demo)... nothing was sent and nothing was stored" (`site.js:248-249`; `wholesale.html:87`).
- Locations page: five branch cards with address, hours, phone, Google Maps links and a source line (`site.js:269-298`). No branch photos and no per-branch page.
- About page: static intro, a values block and a sourced-facts block from `seed.js:410-436` (`about.html:16-58`).
- Header and footer for the five inner public pages come from `ui.js` (`SITE_NAV` at `ui.js:46-54`, `renderSiteHeader` at `ui.js:79`, `renderSiteFooter` at `ui.js:114-129`).

### Careers (applicant side)

- `careers/index.html`: open roles (8 open, 1 closed in the seed), filter by branch and department (`careers.js:96-144`).
- `careers/job.html?id=`: role detail with responsibilities, requirements, a "how hiring works" paragraph and the list of documents (`careers.js:149-196`). Pay reads "Discussed after your interview".
- `careers/apply.html?id=`: five steps: Account, Personal, Experience, Documents, Review (`careers.js:201-207`). Fields: name, email, phone; home address, date of birth, right-to-work tick; experience summary, availability, start date; documents (`careers.js:255-287, 339-357`). Only the government photo ID is required to submit (`careers.js:281`). Consent is two ticks: information is true, and "we may process these details" (`careers.js:283-284`).
- On submit the browser creates the applicant record in localStorage, logs in as `applicant`, clears the draft and redirects to `me.html?submitted=1` (`careers.js:455-463`).
- `careers/me.html`: applicant dashboard. Stage tracker, documents, messages from HR, offer accept or decline, withdraw (`careers.js:472-601`). Gate: `requireRole(['applicant'])` (`careers.js:476`).

### HR console (`hr/index.html`)

- Gate: `requireRole(['hr'])` (`hr.js:7`).
- Pipeline board by stage with a role filter and a name search (`hr/index.html:31-37`, `hr.js:152-160`).
- Applicant drawer: details, document metadata and verify or flag actions, private notes, messages to the applicant, timeline, a "move to stage" select that accepts any stage, interview scheduling, offer form, a "not selected" action that writes a canned message (`hr.js:205-382`).
- Roles tab: open or close a job (`hr.js:408-418`). Compliance tab: employee document expiry.

### Employee portal (`portal/*`)

- `portal/index.html` is the demo role picker (no password). `?as=<role>` signs straight in (`portal.js:108-115`).
- Other pages require `employee`, `hr` or `admin` (`portal.js:9-13`): home with announcements (`portal.js:185`), schedule with shift swap, leave requests, pay with demo payslips (`portal.js:326, 332`), documents and training toggles (`portal.js:361-371`), profile.

### Store admin (`admin/index.html`)

- Gate: `requireRole(['admin'])` (`admin.js:8`).
- Tabs: Specials, Post maker, Stores and hours, Staff notices, Publish (`admin/index.html:24-28`).
- Specials: add, edit, remove a deal with name, department, price, photo (chosen from photos already in the site), posted date, alt text (`admin.js:255-343`).
- Post maker: draws a 1080 by 1350 image in a canvas from an existing photo and a headline, for download (`admin.js:410-422`).
- Stores: edit hours and phone only (`admin.js:772-845`). Notices: post a staff notice (`admin.js:850-911`).
- Publish: edits live only in this browser. "Download data file" exports the whole store as a new `seed.js` (`admin.js:932-950`).

### Options chooser (`options/*`)

`options/index.html` lists the main design and three alternatives. `options/a`, `b`, `c` are three other homepage designs that read `data/seed.js` directly. Evidence: `SITE.md:14-15`. A switcher pill is injected by `assets/options-nav/options-nav.js` and also adds a "Created by Trinovata Technologies" link (`options-nav.js:76-80`).

## 4. What is mock

| Area | What is mock | Evidence |
|---|---|---|
| Sign-in | There is no password and no server check. The "session" is a JSON object in localStorage. `requireRole()` compares `session.role` to a list. `?as=applicant`, `employee`, `hr` or `admin` signs in with one URL. | `store.js:58-78`; `portal.js:89, 108-115`. |
| Roles | Four demo roles: applicant, employee, hr, admin. Role comes from the browser, not from an identity. | `portal.js:89-91`. |
| Data | One blob in the browser's localStorage, seeded from a public JavaScript file. No database. Two browsers never share data. | `store.js:6, 15-36`; `README.md:17`. |
| People data | Every applicant, employee, payslip, bank mask and shift is invented. | `seed.js:5-6`; `portal.js:326`. |
| Document upload (KYC) | Files are previewed in memory with object URLs and never stored or sent. The store keeps name, size, type, state and dates only. | `careers.js:36-41`; `store.js:3-4`; `hr.js:244`. |
| Email and messages | There is no email. "Messages" are text saved in the same localStorage blob. HR sees a toast "Message sent to ..." although nothing leaves the browser. | `hr.js:342`; `hr.js:478` ("demo: no message leaves this browser"). |
| Forms | Wholesale enquiry says nothing is sent. Leave and swap toasts say "request sent" but write to localStorage only. | `site.js:248-249, 264`; `portal.js:246, 297`. |
| Publishing | The admin Publish tab does not publish. It downloads a file for a developer to place in the repo. | `admin/index.html:156-170`; `admin.js:932-950`. |
| Time | "Today" hours and "Open now" use the visitor's browser clock, with Sunday read as `hours[1]` and every other day as `hours[0]`. No Trinidad time zone. | `ui.js:72-77`; `grand-entrance.js:141-145`. |
| Maps | Links to Google Maps only. There is no map embed or map API. | `ui.js:58-69`. |

## 5. PRD requirement to current state

### 5.1 Homepage, WEB-001 to WEB-014 (`SFB-PRD-001.md:321-336`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| WEB-001 Grand Entrance visual (P0) | Scroll-driven SVG scene, header comment `grand-entrance.js:1-5`; markup `index.template.html:31-53`. The scene is an illustration standing in for footage (`index.template.html:50`). Rendering at all supported sizes: not tested. | Exists (demo). Real footage would need Q5. |
| WEB-002 Hero seam correction (P0) | No test evidence in the repo. None produced in this audit (no browser run). | Partial |
| WEB-003 Entrance skip control (P0) | Skip link `<a class="skip" href="#inside">Skip the welcome animation</a>` at `index.template.html:17`; target `<main id="inside" tabindex="-1">` at `index.template.html:55`. Mouse, touch, keyboard and screen-reader behaviour: not tested. | Exists (demo) |
| WEB-004 Hero copy and CTAs (P1) | Hero has two CTAs, to the deals section and to the stores section (`index.template.html:46-47`). Careers is in the nav (`:23`) and in a band lower down (`:101-112`), not in the hero. Copy is not approved by a named owner. | Partial. Approval: Q2. |
| WEB-005 Who We Are (P1) | No such section on the home page (sections are deals `:57`, aisles `:74`, stores `:87`, careers `:101`). A separate About page exists with values written for the concept and a facts list with sources (`about.html:16-58`; `seed.js:412-423`). | Partial. Approval: Q2. |
| WEB-006 Departments Option E (P1) | Departments shown as image cards on the home page (`index.template.html:74-85`) and on `departments.html`. "Option E" is not found in the repo; the repo has main design D and options A, B, C (`SITE.md:14-15`). | Partial |
| WEB-007 Specials preview (P1) | Home shelf shows the 12 newest specials by `posted` date (`grand-entrance.js:127`). Specials carry a post date only, no start or end date, so nothing expires (`seed.js:79-103`). A note says prices were posted June to October 2026 and may have changed (`seed.js:20`). | Partial. Price policy: Q9. |
| WEB-008 Locations preview (P1) | Five store cards with address, hours, phone, directions (`grand-entrance.js:144-148`) from `seed.js:28-52`. Values are from Google Maps listings read 23 Oct 2026, not client-approved (`seed.js:24-27`). | Blocked: decision needed (Q4) |
| WEB-009 Events and news preview (P1) | No events or news section and no events data. The seed's `announcements` are staff notices (`seed.js:394-399`). | Missing |
| WEB-010 Careers preview (P0) | Careers band with three reasons and two links (`index.template.html:101-112`; `grand-entrance.js:149`). It does not list current roles. Visible on mobile: not tested. | Partial |
| WEB-011 Global navigation (P0) | The home page has its own nav (`index.template.html:22-28`). Inner pages use `SITE_NAV` (`ui.js:46-54`), which differs (adds Wholesale, About). The access entry is a fixed "Staff portal" link (`ui.js:102`), not role-sensitive. | Partial |
| WEB-012 Footer and trust (P0) | Footer has the "Unofficial concept" disclaimer (`index.template.html:123`; `ui.js:5, 127-128`) and a phone number. There are no privacy, terms, accessibility or contact pages (see `route-map.md`). `cmd: grep -rni privacy` over html, js, css found nothing. | Partial. Status wording: Q2, Q15. |
| WEB-013 Performance fallback (P0) | Hero copy and CTAs are in static HTML (`index.template.html:37-49`). Deals, aisles, stores and footer lists are empty containers filled by JavaScript (`:70, 82, 97, 120`; `grand-entrance.js:128-151`). There is no `noscript` block on the home page. With reduced motion set, `progress()` returns 1 (`grand-entrance.js:37-38`) and a CSS media query exists (`grand-entrance.css:201`). Not tested in a browser. | Partial |
| WEB-014 Editorial polish (P1) | Copy is the concept's own and unapproved. Seed holds `.example` placeholder emails (`seed.js:18`), not shown on any page (`cmd: grep -rn "sfb.example"` outside `seed.js` found nothing). | Partial. Approval: Q2. |

### 5.2 Department directory, WEB-020 to WEB-026 (`SFB-PRD-001.md:345-353`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Bullet 1: name, approved imagery, description, optional specials | Seven departments with name, short name, image and alt text (`seed.js:58-73`). Images are crops from the company Instagram, no permission recorded (`assets/img/SOURCES.md:5-9`). | Partial. Rights: Q5. |
| Bullet 2: follow Option E composition | Option E not found in the repo (see WEB-006). | Partial |
| Bullet 3: links go to category pages or filtered specials, no implied inventory | Cards link to `specials.html?dept=<id>` (`site.js:188`). | Exists (demo) |
| Bullet 4: no branch availability inferred from category presence | Not found: no per-branch department data. Specials have a `couva` tag (`seed.js:79`) used as a filter (`site.js:128-173`). | Exists (demo) |
| Bullet 5: accessible cards, empty states, search only if needed | Keyboard and screen-reader behaviour not tested. An empty state exists on the specials filter (`site.js:158`). | Partial |
| Bullet 6: admin-managed order and publication status | No department editor in the admin. Tabs are Specials, Post maker, Stores and hours, Staff notices, Publish (`admin/index.html:24-28`). Order is array order in `seed.js`. | Missing |
| Bullet 7: Done criteria (content editable, approved) | Not met: no editing, no approval. | Missing |

### 5.3 Store finder, WEB-030 to WEB-039 (`SFB-PRD-001.md:355-365`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Bullet 1: directory with address, hours, phone, images, map link, directions CTA | Locations page and home cards show address, hours, phone and Google Maps links (`site.js:269-298`; `grand-entrance.js:144-148`). No branch images. | Partial |
| Bullet 2: dedicated page per branch with photos and local specials | Not found. The footer links to `locations.html#<branch id>` (`ui.js:116`), an anchor on one page. | Missing |
| Bullet 3: map focused on southwest Trinidad with pins | Not found. No map library or embed; Google Maps deep links only (`ui.js:58-69`). | Missing. Provider: Q7. |
| Bullet 4: text list as primary fallback | The text list is the only view. | Exists (demo) |
| Bullet 5: verify hours and phones with client | Hours and phones are from Google Maps, read 23 Oct 2026 (`seed.js:24-27, 31-32, 35-36, 41-42, 46-47, 50-51`). | Blocked: decision needed (Q4) |
| Bullet 6: last-updated date, holiday exceptions | Source line with read date on each card (`site.js:292`). Holiday text is a caveat only: "Public holiday hours may differ" (`site.js:294`). No structured exceptions. | Partial |
| Bullet 7: canonical branch IDs, ambiguous maps data | Five stable ids: `sando`, `couva`, `ptown`, `penal`, `pfortin` (`seed.js:29, 33, 39, 44, 48`). Princes Town has two Google listings 60 m apart (`seed.js:42`). | Blocked: decision needed (Q4) |
| Bullet 8: never require geolocation | `cmd: grep -rni geolocation` over html, js, css found nothing. | Exists (demo) |
| Bullet 9: Done (found, opened, navigated; provenance and approval; map failure degrades) | Provenance is recorded per branch (`seed.js:32, 36, 42, 47, 51`). Approval is not. | Blocked: decision needed (Q4) |

### 5.4 About, heritage, values and events, WEB-040 to WEB-049 (`SFB-PRD-001.md:367-375`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| About page with approved history and values | `about.html` exists. Text says it is unverified with the company (`about.html:41`). Values text is the concept's own (`seed.js:412-417`). | Partial. Approval: Q2. |
| Events model, Trinidad time zone, news with sanitisation and scheduling | No events or news model, page or admin tab. | Missing |

### 5.5 Job listings, REC-001 to REC-012 (`SFB-PRD-001.md:379-388`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Bullet 1: list with title, location, department, type, opening and closing date, summary, CTA | Card shows department, title, branch, type, shift, posted date and a View button (`careers.js:121-130`). No closing date field in a job (`seed.js:143-189`). Summary is on the detail page only. | Partial |
| Bullet 2: filters by branch, department, type; search | Branch and department filters only (`careers.js:100-110`). No type filter, no keyword search. | Partial |
| Bullet 3: job details incl. closing policy, privacy notice, contact guidance | Responsibilities, requirements, hiring-steps paragraph, document list (`careers.js:166-195`). No closing policy, privacy notice or contact guidance found. | Partial |
| Bullet 4: HR creates, edits, duplicates, schedules, publishes, pauses, closes, archives | Only an open or close toggle on the Roles tab (`hr.js:408-418`). No create, edit, duplicate, schedule or archive. | Partial |
| Bullet 5: stable ids, unique slugs, version history, indexed pages | Stable ids such as `job-bakery-ptown` (`seed.js:144`). URL is `job.html?id=`, no slug. No version history. Pages are `noindex`. | Partial |
| Bullet 6: closing disables new submissions, keeps applicant access | `apply.html` refuses a job that is not open (`careers.js:222-226`). Applicant dashboard keeps working (`careers.js:476`). | Exists (demo) |
| Bullet 7: deadlines in a declared time zone | No closing date or time zone anywhere in job records. | Missing |
| Bullet 8: no salary claim until HR approves | Listing and detail say pay is discussed at interview (`careers.js:126, 182`). HR can enter pay on an offer (`hr.js:375-382`). Wording not reviewed by HR. | Exists (demo). Policy: Q6. |

### 5.6 Candidate identity and application form, REC-020 to REC-038 (`SFB-PRD-001.md:390-402`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Bullet 1: registration at Apply, not for browsing | Step 1 "Account" asks name, email, phone. There is no password and no account is created; submit just writes a record and sets a browser session (`careers.js:255-262, 339-344, 455-463`). Browsing needs no sign-in. | Partial |
| Bullet 2: email verification, recovery, anti-abuse, terms and privacy acknowledgment | None. Only two tick boxes: information is true; consent to process (`careers.js:283-284`). No privacy or terms text exists. | Missing |
| Bullet 3: fields configurable per job or form definition | Fixed form. A job only carries a list of document ids (`seed.js:148`). | Missing |
| Bullet 4: no irrelevant or excessive personal data | Collects home address and date of birth for every role (`careers.js:268-271, 350-351`). Every job's document list includes BIR number, NIS, certificate of character, proof of address, two references and a bank letter (`seed.js:120-130, 148`). The job page lists all of them (`careers.js:186-193`). Only photo ID is required to submit (`careers.js:281`). | Partial. Fields: Q6. |
| Bullet 5: inline, accessible validation | Inline errors with `aria-invalid` handling in the apply form (`careers.js:255-300`). Not tested with assistive technology. | Exists (demo) |
| Bullet 6: save and resume, draft indicator, network recovery | Every change saves a draft to localStorage (`careers.js:209-212, 251`). A visible "draft saved" indicator: not found. No network involved. | Partial |
| Bullet 7: allowlisted types and sizes, scanning, safe storage, signed retrieval, versions | Allowlist pdf, jpg, png and 8 MB limit (`careers.js:22-35`). No scanning, no storage (bytes dropped), no retrieval, no versions. | Partial |
| Bullet 8: duplicate rules | `addApplicant` has no duplicate check (`store.js:104-111`). | Missing |
| Bullet 9: confirmation with reference ID, timestamp, email receipt | Confirmation line: "Thanks, your application is in" (`careers.js:551`). No reference ID shown, no timestamp, no email. The dashboard shows an "Applied" date (`careers.js:553`). | Partial |
| Bullet 10: applicant views summary, uploads requested documents, updates contact data, withdraws, reads messages | Dashboard has documents, messages (`careers.js:532-534`), withdraw (`careers.js:596-601`). Contact-data editing: not found. | Partial |
| Bullet 11: status changes recorded with actor, time, reason, old and new values, notification outcome | `setStage` pushes `{ at, text }` with text "Moved to X - note" (`store.js:117-123`). No actor field, no old value, no notification outcome. | Partial |

### 5.7 Status model, REC-040 (`SFB-PRD-001.md:404-420`)

Repo stages: `seed.js:132-141`, `hr.js:9-12`, `careers.js:472-473`. Stage ids are `submitted`, `screening`, `kyc`, `interview`, `offer`, `hired`, `not-selected`, `withdrawn`.

| PRD internal stage | Repo equivalent | Status |
|---|---|---|
| draft | Not a stored stage. A draft is a localStorage key `sfb-apply-draft-<jobId>` (`careers.js:209-212`). | Partial |
| submitted | `submitted` | Exists (demo) |
| screening | `screening` | Exists (demo) |
| documents_requested | No such stage. Nearest is `kyc` "KYC review" (`seed.js:135`). Document-level states exist (`ui.js:286-294`). | Partial |
| interview | `interview` | Exists (demo) |
| on_hold | None | Missing |
| offer | `offer` | Exists (demo) |
| hired | `hired`. The applicant sets it by accepting an offer (`careers.js:582-587`). | Exists (demo) |
| declined | `not-selected`, label "Not selected", tone "bad" (`seed.js:139`). HR action writes a canned message with a six-month retention sentence (`hr.js:354-359`). | Partial |
| withdrawn | `withdrawn` | Exists (demo) |
| closed (position closed) | None | Missing |

State machine rules (`SFB-PRD-001.md:420`): no rules. The HR "move to stage" select lists every stage and `setStage` accepts any value (`hr.js:289, 346-350`; `store.js:117-123`). The applicant triggers `hired` directly (`careers.js:586`). There is no reopening audit. Final public vocabulary needs HR sign-off: Q6.

### 5.8 HR intake and review, REC-050 to REC-068 (`SFB-PRD-001.md:422-431`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Bullet 1: queue with filters (job, location, stage, age, updated, assignment, missing documents) | Board by stage, filter by role, search by name (`hr/index.html:31-37`; `hr.js:152-160`). No location, age, updated date, assignment or missing-document filter. | Partial |
| Bullet 2: profile with submitted version, documents, contact, timeline, reviewer assignment, notes | Drawer has contact, document metadata, timeline, notes (`hr.js:205-304`). No submitted-version snapshot and no reviewer assignment. | Partial |
| Bullet 3: private notes hidden from applicant | Notes are written in `hr.js:246-250`. The applicant script does not mention notes (`cmd: grep -n "notes" assets/js/careers.js` returned nothing). Enforced only by what the page prints; the data sits in the same browser store. | Exists (demo) |
| Bullet 4: template-based communications with preview and send permission | Free-text composer (`hr.js:251-255`) and one canned message (`hr.js:354-359`). No templates, preview or send permission. | Missing |
| Bullet 5: CSV export permission-gated and logged | `cmd: grep -in "csv\|export\|download" assets/js/hr.js` returned nothing. | Missing |
| Bullet 6: no automated decisions or biased ranking | `cmd: grep -in "score\|rank" assets/js/hr.js` returned nothing. No automated decisions found. | Exists (demo) |
| Bullet 7: retention and deletion workflow | Only a sentence in a message: "keep your application on file for six months" (`hr.js:358`; `seed.js:271`). No deletion. | Missing. Retention: Q6. |
| Bullet 8: Done (end-to-end test, strict ownership and access tests) | No tests in the repo. | Missing |

### 5.9 Promotional content, MKT-001 to MKT-016 (`SFB-PRD-001.md:435-448`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Campaign types: weekly specials, flash sales, evergreen | One record type, `specials` (`seed.js:78-104`). | Missing |
| Campaign fields (branch scope, start and end timestamps, time zone, disclaimers, eligibility, audience, status, priority, landing destination, CTA, creation and approval metadata) | A special has `id`, `name`, `dept`, `price`, `img`, `posted`, `couva`, `isNew`, `alt` (`seed.js:79-103`; admin record `admin.js:343`). The rest are not found. | Partial |
| Public weekly specials without login | `specials.html` has no gate. | Exists (demo) |
| Restricted specials labelled, signup only for restricted details | Not found. | Missing |
| Dates control active and expired state on the server, Trinidad time | No start or end date and no server. | Missing |
| Reusable card templates, approved media, overlays, preview and cropping | Post maker makes a 1080 by 1350 image from an existing photo, headline and price, with a preview canvas and a focus control (`admin.js:410-422, 756`). One template. | Partial |
| External image upload validated, optimised, rights-checked | Not found. The photo library lists existing photos only (`admin.js:30-39`). | Missing |
| Validity, participating branches, terms; no stock guarantee | Not found on cards (`site.js:21-33`). A note says shelf prices may have changed (`seed.js:20`). | Partial |
| Role permissions for draft, approve, schedule, publish, unpublish, archive | One `admin` role can add, edit, remove. No draft, approve, schedule or archive (`cmd: grep -in "approv\|draft\|schedul\|expir\|audit\|revision" assets/js/admin.js` shows only form-validation and canvas-timer matches). | Missing. Authoring and approval: Q9. |
| Empty state explains no live specials | Empty state exists only for the Couva filter: "No Couva-tagged posts in this department yet" (`site.js:158`). | Partial |
| Done: create, preview, approve, schedule, activate, expire, archive, audit logged | Not met. | Missing |

### 5.10 Account policy and customer profile, MKT-020 and MKT-025 to MKT-036 (`SFB-PRD-001.md:450-469`)

| PRD ref | Current state and evidence | Status |
|---|---|---|
| MKT-020 mandatory accounts only for job application and restricted offers | Browsing, specials, locations, careers details need no sign-in (see `route-map.md`). The applicant "account" is a form step with no password (`careers.js:339-344`). No restricted offers exist. | Partial |
| MKT-025..036 bullet 1: profile fields (name, verified email; optional phone, birthday, preferred branch) | No customer account, sign-in or profile page. | Missing |
| Bullet 2: birthday deal rules | Not found. | Missing |
| Bullet 3: unique account ID, QR only with a real workflow | Not found. | Missing |
| Bullet 4: opaque QR token | Not found. | Missing |
| Bullet 5: contact editing, notification preferences, consent history, deletion request, sessions | Not found. | Missing |
| Bullet 6: no empty loyalty or analytics dashboard | None built. | Exists (demo) |
| Bullet 7: multi-role member moves between profile and applicant portal | Session holds one role at a time (`store.js:58-65`). | Missing |

### 5.11 Newsletter, MKT-040 to MKT-057 (`SFB-PRD-001.md:471-482`)

`cmd: grep -rli "newsletter\|subscribe"` over html, js, css found nothing.

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Bullet 1: guest email capture on home, specials, footer | Not found. | Missing |
| Bullet 2: disclosure of purpose, frequency, sender; channel opt-in | Not found. | Missing |
| Bullet 3: consent ledger | Not found. | Missing |
| Bullet 4: double opt-in | Not found. | Missing |
| Bullet 5: email provider integration and templates | No email provider. | Missing. Provider: Q7, Q8. |
| Bullet 6: transactional kept separate from promotional | No email of either kind. | Missing |
| Bullet 7: segmentation from consented data only | Not found. | Missing |
| Bullet 8: schedule, preview, test-send, audience estimate, unsubscribe, suppression, audit | Not found. | Missing |
| Bullet 9: bounce and complaint handling | Not found. | Missing |
| Bullet 10: no Microsoft promise before requirements are confirmed | No Microsoft integration in the repo. | Blocked: decision needed (Q8) |
| Pre-existing Google Form contacts (section 9.6, 14.4) | Not found in the repo. | Blocked: decision needed (Q12) |

### 5.12 Restricted codes, MKT-060 to MKT-076 (`SFB-PRD-001.md:484-493`)

`cmd: grep -rni "promo code\|coupon\|redeem\|qr code"` found one match, a marketing sentence in `options/index.html:146` ("one coupon block per department"), which is design copy, not a feature.

| PRD ref | Current state and evidence | Status |
|---|---|---|
| Display or claim mode, validated redemption mode | No codes, no claim, no redemption. | Blocked: decision needed (Q10) |
| Server-side entitlement checks, atomic redemption, audit | No server. | Missing |
| Launch gate: no "instantly redeem" copy without a verified mechanism | No such copy found. | Exists (demo) |
| Loyalty compatibility (MKT-FUTURE) | No loyalty fields or mappings. No fake points either. | Blocked: decision needed (Q11) |

### 5.13 Staff dashboard, STF-001 to STF-007 (`SFB-PRD-001.md:507-515`)

| ID | Current state and evidence | Status |
|---|---|---|
| STF-001 provisioned staff sign-in (P0) | Role cards, no credentials (`portal.js:106-132`). `requireRole(['employee','hr','admin'])` (`portal.js:9-13`). | Partial. Identity: Q7. |
| STF-002 home and profile (P1) | `portal/home.html`, `portal/profile.html` render a demo employee (`portal.js:479`). | Exists (demo) |
| STF-003 shifts (P1 conditional; no simulated production data) | `portal/schedule.html` shows seeded shifts and a swap request (`portal.js:246`; `seed.js:298`). Simulated data, labelled demo. | Blocked: decision needed (Q13) |
| STF-004 pay summary (P1 conditional) | `portal/pay.html` shows demo payslips: "Demo payslip, not a real document" (`portal.js:326, 332`). | Blocked: decision needed (Q13) |
| STF-005 cumulative work data (P2) | `cmd: grep -in "year.to.date\|ytd\|cumulative\|hours worked"` over `portal.js`, `seed.js`, `portal/*.html` found nothing. | Missing |
| STF-006 training links and acknowledgments (P2) | Training list with a done toggle (`portal.js:361-371`). HR module for assigning training: not found. | Partial |
| STF-007 announcements and policies (P1) | Announcements filtered by branch (`portal.js:185`), posted from the admin (`admin.js:850-911`). Policy documents: clicking shows "Demo: policy documents are not included" (`portal.js:377`). | Partial |

### 5.14 Store administration, ADM-001 to ADM-010 (`SFB-PRD-001.md:543-554`)

| ID | Current state and evidence | Status |
|---|---|---|
| ADM-001 role-scoped login, branch membership validated on server (P0) | Client-side gate `['admin']` (`admin.js:8`). One admin sees and edits every branch. No server. | Partial |
| ADM-002 promotional calendar | Not found. | Missing |
| ADM-003 campaign composer (templates, media, text, disclaimer, valid date, preview) | Deal drawer plus Post maker (`admin.js:255-343, 410-422`). No disclaimer or valid-date fields. | Partial |
| ADM-004 draft and publish with approval and audit | Not found. "Publish" is a file download (`admin.js:932-950`). | Missing. Approval: Q9. |
| ADM-005 branch information with review | Hours and phone only, no review step (`admin.js:772-845`). Address and name not editable. | Partial. Q4. |
| ADM-006 events and news publishing | Staff notices only (`admin.js:850-911`). | Missing |
| ADM-007 newsletter campaign requests | Not found. | Missing |
| ADM-008 analytics | No analytics anywhere (`cmd: grep -rni "gtag\|googletagmanager\|plausible\|posthog\|hotjar\|mixpanel\|_vercel/insights"` found nothing). | Missing |
| ADM-009 media library with search, reuse, alt text, rights metadata | Library of photos already in the site, alt text required on a deal (`admin.js:30-39, 321`). No upload, no search, no rights metadata. | Partial |
| ADM-010 user and role admin, least privilege, MFA, audit | Not found. Roles are fixed cards (`portal.js:127-131`). | Missing |

### 5.15 Authentication and security, PRD sections 4.1, 13.1, 13.2 (`SFB-PRD-001.md:193-201, 562-581`)

| PRD requirement | Current state and evidence | Status |
|---|---|---|
| 4.1: every protected operation checks role, branch, ownership, action on the server | No server. Role check is `requireRole` in the browser (`store.js:67-78`). PRD 22.3 lists "auth checks only in client" as a disqualifier (`SFB-PRD-001.md:967`). | Missing |
| 4.1: applicant data never visible to store content administrators | Not true. The admin export writes the whole store, including applicants (`admin.js:931-933`; the Publish tab lists "Everything else (jobs, applications, staff records)" among the changes, `admin.js:929`). The export is one file holding everything in the browser store. | Missing |
| 4.1: staff payroll and shift data inaccessible to public accounts | Demo employee records, bank masks and payslips are in the public file `/data/seed.js`: live HTTP 200, 48,347 bytes, `Access-Control-Allow-Origin: *` (`cmd: curl -sI https://southern-food-basket.vercel.app/data/seed.js`). Applicants start at `seed.js:192`, employees at `seed.js:285`. The data is invented, but the pattern is the same as real data would follow. | Missing |
| 13.1: audit existing auth before choosing a provider | No auth provider exists. | Blocked: decision needed (Q1, Q7) |
| 13.1: distinct identity, profile, membership, grant, subscription | One role string in the session (`store.js:61-65`). | Missing |
| 13.1: staff, HR and admins provisioned, ideally MFA | Not found. `?as=` signs in as any role (`portal.js:108-115`). | Missing |
| 13.1: company email never grants privilege | No email-based privilege. Not applicable. | Exists (demo) |
| 13.1: session handling across sites (redirect, CSRF, fixation, logout) | Session in localStorage with no expiry check (`store.js:58-65`). `?next=` redirect is restricted to a plain relative path (`portal.js:92-100`). | Partial |
| 13.2: TLS, secure cookies, CSP, HSTS, safe headers | HSTS present on the live host. No CSP and no other headers; no `vercel.json` to set them (`cmd: curl -sI`). No cookies used. | Partial |
| 13.2: rate limits and spam protection | No server, so nothing to limit. No bot protection on forms. | Missing |
| 13.2: private document storage, scanning, short-lived access | File bytes are never stored (`store.js:3-4`). | Missing |
| 13.2: role tests for horizontal and vertical escalation | No tests. | Missing |
| 13.2: encryption at rest, secrets management, no credentials in repo | No tracked secrets (`.gitignore:9`). `.env.local` holds a variable name only. | Exists (demo) |
| 13.2: audit of critical actions | Timeline text only (`store.js:117-123`). No audit log. | Missing |
| 13.2: data minimisation, retention, export and deletion | See REC-020 bullet 4 and REC-050 bullet 7. | Partial |
| 13.2: dependency and security scans in CI, incident response | No CI, no dependencies, no runbook found. | Missing |

## 6. Contradictions inside the repo

1. Hours and phones: `seed.js:6` and `about.html:51` say hours and phone numbers are invented. `seed.js:24-27`, `site.js:294`, `ui.js:5` and `index.template.html:94` say they come from Google Maps listings. The PRD calls the Google values preliminary (`SFB-PRD-001.md:361`). Q4 settles it.
2. Admin copy says edits reach the home page: `admin/index.html:35`, `admin/index.html:103`, `admin.js:223`. The home page reads `window.SFB_DATA` only (`grand-entrance.js:7`) and never sees the browser store, so admin edits to specials, hours and phones do not appear on it. They do appear on the specials, departments, locations, wholesale and about pages, which load `store.js`.
3. Admin Publish text says the export "puts it in place of `data/seed.js`" (`admin/index.html:169`), but the export drops the source comments and swaps in a shorter header that points back to the original file (`admin.js:934-942`). Replacing the file with the export would remove the provenance notes in `seed.js`.

## 7. Not found

- Any server, API route, database, storage bucket, auth provider, email service, queue, cron or webhook.
- Customer accounts, newsletter, promo codes, events or news, privacy, terms, accessibility or contact pages, per-store or per-special pages, sitemap, robots.txt, structured data.
- CI, tests, lint, dependency scan, error monitoring, analytics.
- A reference ID on application confirmation, applicant contact editing, CSV export, reviewer assignment, job create, edit or duplicate, message templates with preview.
- A closing date or time zone on jobs; a start or end date on specials.
- Any record of client approval of copy, prices, branch details or photographs.
