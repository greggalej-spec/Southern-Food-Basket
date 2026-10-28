# Route map: Southern Food Basket concept site

S0 audit file 2 of 5. Written 2026-10-28 for PRD section 27.1 (`docs/prd/SFB-PRD-001.md:1156`). PRD routes are from section 5.2 (`SFB-PRD-001.md:213-261`).

## 1. How the pages were found

- `cmd: find . -name "*.html"` (excluding `docs/`, `.git`, `.vercel`, `node_modules`) returned 25 files. All 25 are listed below.
- Gate = what `SFBStore.requireRole()` does when the page script runs. It is defined at `assets/js/store.js:67-78`. It compares `session.role` (a string in localStorage) with a list. If it fails, it sends the browser to `portal/index.html?next=...` (`store.js:73-76`). It runs in the browser, after the page HTML has loaded. It is not access control: anyone can set the session in the browser console or with `?as=<role>` (`portal.js:108-115`).
- "No gate" means the page script never calls `requireRole`.
- There is no server router. Routes are files. Paths use `.html` and query strings (`?id=`), not clean URLs or slugs.
- Every page carries `<meta name="robots" content="noindex">` except `_capture.html` (`cmd: grep -c 'name="robots" content="noindex'`). `_capture.html` is not deployed.
- Live check on 2026-10-28 with `curl`: these paths return 404 on https://southern-food-basket.vercel.app: `/robots.txt`, `/sitemap.xml`, `/api/social-feed`, `/CLAUDE.md`, `/SITE.md`, `/README.md`, `/_capture.html`, `/tools/grand-entrance/build.js`, `/docs/prd/SFB-PRD-001.md`, `/assets/img/SOURCES.md`, `/.git/config`, `/.env.local`. `/data/seed.js` returns 200.

## 2. Pages

### 2.1 Public pages (no gate)

| File | Purpose | Audience | Gate | PRD 5.2 route |
|---|---|---|---|---|
| `index.html` (generated from `tools/grand-entrance/index.template.html`) | Main home page "Grand Entrance": animated store-front scene, deals shelf, departments, five store cards, careers band. Reads `data/seed.js` only (`grand-entrance.js:7`). | Anyone | None | `/` matches |
| `about.html` | Short company intro, values, sourced facts with sources, an "About this concept" box that names Trinovata (`about.html:16-58`). | Anyone | None | `/about` matches (path is `about.html`) |
| `departments.html` | Department cards, each linking to `specials.html?dept=<id>` (`site.js:178-197`). | Anyone | None | `/departments` matches |
| `specials.html` | 25 specials with department chips and a Couva-tag checkbox. State in `?dept=` and `?couva=1` (`site.js:125-173`). | Anyone | None | `/specials` matches. `/specials/[slug]` has no equivalent: no detail page exists. |
| `locations.html` | Five store cards: address, hours, phone, Google Maps links, source line (`site.js:269-298`). Footer links use `locations.html#<branch id>` (`ui.js:116`). | Anyone | None | `/stores` matches in purpose; path name differs. `/stores/[slug]` has no equivalent. |
| `wholesale.html` | Wholesale and trade page: sourced facts, product lines, customer types, a demo enquiry form that sends nothing (`site.js:200-266`; `wholesale.html:87`). | Trade customers | None | No PRD 5.2 equivalent. The PRD mentions wholesale as identity only (`SFB-PRD-001.md:53, 141, 664`). |

### 2.2 Careers (applicant side)

| File | Purpose | Audience | Gate | PRD 5.2 route |
|---|---|---|---|---|
| `careers/index.html` | Open roles, branch and department filters (`careers.js:96-144`). | Anyone | None | `/careers` matches |
| `careers/job.html?id=<job id>` | Role detail and the list of documents needed (`careers.js:149-196`). A closed or unknown id shows "no longer open" (`careers.js:156`). | Anyone | None | `/careers/[job-slug]` matches in purpose. It uses `?id=job-bakery-ptown`, not a slug. |
| `careers/apply.html?id=<job id>` | Five-step application form: Account, Personal, Experience, Documents, Review (`careers.js:201-207`). Refuses a job that is not open (`careers.js:222-226`). On submit, creates a record in localStorage and signs the browser in as `applicant` (`careers.js:455-463`). | Job seeker | None. Anyone can apply without any account. | No PRD 5.2 route. The PRD journey 6.1 (`SFB-PRD-001.md:283`) has an Apply step with sign-in or account creation; no real account exists here. |
| `careers/me.html` | Applicant dashboard: stage tracker, documents, messages, offer accept or decline, withdraw (`careers.js:472-601`). | Applicant | `requireRole(['applicant'])` (`careers.js:476`) | `/applicant`, `/applicant/applications`, `/applicant/applications/[id]`, `/applicant/documents`, `/applicant/messages` are all folded into this one page. `/applicant/profile` has no equivalent. |

### 2.3 Employee portal

| File | Purpose | Audience | Gate | PRD 5.2 route |
|---|---|---|---|---|
| `portal/index.html` | Demo sign-in. Four role cards: applicant `app-aaliyah`, employee `emp-keisha`, hr `emp-devon`, admin `emp-ria` (`portal/index.html:19, 24, 29, 34`). No password. `?as=<role>` signs in directly (`portal.js:108-115`). | Anyone | None. It is the login page. | No direct equivalent. Nearest are `/account/sign-in` and the ops-app sign-in, neither of which is in the repo. |
| `portal/home.html` | Employee home with announcements filtered by branch (`portal.js:185`). | Employee | `requireRole(['employee','hr','admin'])` (`portal.js:9-13`) | `/staff` matches |
| `portal/schedule.html` | Shifts and shift-swap request, demo data (`portal.js:246`). | Employee | Same as above | `/staff/shifts` matches |
| `portal/pay.html` | Demo payslips (`portal.js:326, 332`). | Employee | Same as above | `/staff/pay` matches |
| `portal/profile.html` | Employee record: details, editable emergency contact, masked bank account, identity documents (`portal/profile.html:10-50`; `portal.js:436-470`). | Employee | Same as above | `/staff/profile` matches |
| `portal/leave.html` | Leave balances and leave requests. | Employee | Same as above | No PRD 5.2 equivalent. Leave is not mentioned in the PRD (`cmd: grep -in "leave"` on the PRD returned no match). |
| `portal/docs.html` | Documents and training list with a "done" toggle (`portal.js:361-371`); policy links show a demo toast (`portal.js:377`). | Employee | Same as above | No PRD 5.2 route. Relates to STF-006 and STF-007 (`SFB-PRD-001.md:514-515`). |

The gate on the portal pages lets `employee`, `hr` and `admin` in. An `hr` or `admin` session therefore sees the employee portal too (`portal.js:9-13`; `ROLE_AREA` at `portal.js:90`).

### 2.4 HR console and store admin

| File | Purpose | Audience | Gate | PRD 5.2 route |
|---|---|---|---|---|
| `hr/index.html` | HR console with three tabs: Hiring pipeline, Roles, Compliance (`hr/index.html:24-26`). Applicant drawer for notes, messages, stage moves, interview, offer (`hr.js:205-382`). | HR | `requireRole(['hr'])` (`hr.js:7`) | `/hr`, `/hr/jobs`, `/hr/applications`, `/hr/applications/[id]` are folded into this page and a drawer. `/hr/training` has no equivalent. |
| `admin/index.html` | Store admin with five tabs: Specials, Post maker, Stores and hours, Staff notices, Publish (`admin/index.html:24-28`). | Store content admin | `requireRole(['admin'])` (`admin.js:8`) | `/store-admin`, `/store-admin/specials`, `/store-admin/locations`, `/store-admin/media` are folded into this page. `/store-admin/campaigns` has no equivalent. `/admin/users`, `/admin/roles`, `/admin/audit` have no equivalent. |

Links: the public footer links to `hr/index.html` (`ui.js:125`; `index.template.html:121`). The admin page is linked from the options chooser (`options/index.html:126`) and from the in-app menu (`ui.js:166-170`).

### 2.5 Design options and helper files

| File | Purpose | Audience | Gate | PRD 5.2 route |
|---|---|---|---|---|
| `options/index.html` | Chooser for the main home design and alternatives A, B, C; lists portal links and shows screenshots (`options/index.html:106, 154`). | Reviewers | None | No PRD 5.2 equivalent. Relates to PRD 17.4 design directions (`SFB-PRD-001.md:770`). |
| `options/a/index.html` | Home page design A, "The Storefront". Reads `data/seed.js` only (`options/a/index.html:524`). | Reviewers | None | No PRD 5.2 equivalent |
| `options/b/index.html` | Home page design B, "Weekly Flyer" (`options/b/index.html:618`). | Reviewers | None | No PRD 5.2 equivalent |
| `options/c/index.html` | Home page design C, "Market Day" (`options/c/index.html:730`). | Reviewers | None | No PRD 5.2 equivalent |
| `_capture.html` | Local screenshot helper. Excluded from deploys by `.vercelignore:1`. | Developer | None | No PRD 5.2 equivalent |
| `tools/grand-entrance/index.template.html` | Input for `build.js`. Excluded from deploys by `.vercelignore:2`. | Developer | None | No PRD 5.2 equivalent |

## 3. PRD 5.2 routes with no equivalent in the repo

| PRD route | Note |
|---|---|
| `/specials/[slug]` | Specials are cards only. |
| `/stores/[slug]` | Branches are cards on one page. |
| `/events`, `/events/[slug]` | No events or news content or pages. |
| `/newsletter/preferences` | No newsletter. |
| `/account/sign-in`, `/account/register`, `/account/profile`, `/account/offers` | No customer accounts. |
| `/privacy`, `/terms`, `/accessibility`, `/contact` | None of these pages exist. `cmd: grep -rni privacy` over html, js and css found nothing. |
| `/applicant/profile` | Not found. |
| `/hr/training` | Not found. HR has a Compliance tab for employee document expiry only. |
| `/store-admin/campaigns` | Not found. |
| `/admin/users`, `/admin/roles`, `/admin/audit` | Not found. |

## 4. Pages in the repo that the PRD route list does not have

`wholesale.html`, `portal/leave.html`, `portal/docs.html`, `careers/apply.html`, `options/*`.

## 5. Gate summary

| Role string | Pages it opens | Source |
|---|---|---|
| `applicant` | `careers/me.html` | `careers.js:476` |
| `employee` | `portal/home`, `schedule`, `pay`, `profile`, `leave`, `docs` | `portal.js:9-13` |
| `hr` | `hr/index.html`, plus all portal pages | `hr.js:7`; `portal.js:9-13` |
| `admin` | `admin/index.html`, plus all portal pages | `admin.js:8`; `portal.js:9-13` |
| none | Everything else, including `portal/index.html` | route tables above |

How a session starts: `login(role, userId)` writes `{ role, userId, at }` to localStorage key `sfb-session-v1` (`store.js:61-65`). The `at` value is never checked, so a session does not expire. The apply form calls `login('applicant', id)` on submit (`careers.js:460`).
