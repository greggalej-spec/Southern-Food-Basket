# Integrations

Every outside service the real app needs, what in the code stands in for it today, and what calls it. The demo makes
zero network calls (`fetch()` count: 0, see [generated/externals.md](generated/externals.md)); everything below is
simulated in the browser.

## 1. Services

| Service | Stands in for it today | Called by | Recommendation | Status |
|---|---|---|---|---|
| Database | `lib/store.ts` + localStorage (`sfb-data-v1`) | every write in [generated/writes.md](generated/writes.md), every read in [generated/screens.md](generated/screens.md) | Postgres (Supabase), one table per collection in [generated/data-model.md](generated/data-model.md) | Decision D1 |
| Authentication | session object in localStorage (`sfb-session-v1`) | `login()`, `useRequireRole()` | Supabase Auth: passwords + MFA for staff, sign-in links and codes for applicants and shoppers | Decision D1 |
| File storage | nothing: documents keep name, size and type only (`DocRecord`) | applicant and staff documents, supplier workbooks, sell-out attachments, request letters, flyer images, resources | Private bucket with signed upload and download URLs, virus scan, checksums (PRD `application_documents`); a public bucket and CDN for flyers | Needed |
| Transactional e-mail | the demo outbox (`outbox`, `mail()` in `lib/newsletter.ts`) | sign-in links, codes, confirmations, application updates, replies (section 2) | One provider for all three kinds, with separate sending streams (for example Postmark or Resend) | Decision D2 |
| Marketing e-mail | the same outbox | newsletter sends (`sendNow`, `sendDue`) | Same provider, marketing stream, List-Unsubscribe header, bounce and complaint webhooks writing back to `subscribers` and `consents` | Decision D2 |
| Internal e-mail | the same outbox | staff updates and reminders | Same provider, internal stream | Decision D2 |
| Scheduler | runs only when a screen opens (`sendDue()`, `sendDueStaffUpdates()`) | scheduled newsletters and staff updates | Vercel Cron or Supabase `pg_cron` calling server functions every 5 minutes | Needed |
| Maps | OpenStreetMap tiles through Leaflet on `/locations`; Google Maps links by `placeId` | `components/site/store-map.tsx`, `lib/format.ts` | Keep. Add the OSM attribution and a tile usage policy check; cache or self-host tiles if traffic grows | Working |
| Social media figures | demo data (`socialWeeks`, `socialPosts`); connecting flips a flag | `/admin#analytics`, `/admin#social` | Meta Graph API (Instagram, Facebook) and TikTok Business API: OAuth per account, encrypted tokens on the server, a daily pull | Needed |
| Spam and abuse protection | browser-tab rate limits only | public forms: feedback, requests, sign-up, applications, sign-in links | Cloudflare Turnstile or hCaptcha on public forms; server rate limits per IP and address | Needed |
| Error monitoring | none | everything | Sentry (or the host's equivalent) on server and browser, scrubbed of personal data | Recommended |
| Analytics | none | public pages | A privacy-friendly analytics tool (no cookies), or none; never on staff pages | Optional |
| Hosting | Vercel (static and Next.js deployments) | | Keep Vercel; production deploys only on approval (existing rule) | Working |
| Rostering and payroll | seed data (`shifts`, `payslips`) with no screen that creates it | `/portal/schedule`, `/portal/pay` | Import from whatever the company uses, or add HR entry screens | Decision D3 |
| Point of sale | the till check page `/portal/till` | `redeemCode()` | Keep the web till check first; a POS integration later if the company's system allows it | Later |
| Inbound messages | requests and feedback come only through the forms or are typed in | `logRequest()` | Optional: an inbound e-mail address or WhatsApp Business that creates requests | Optional |

## 2. Every message the system sends

Found from every `mail()` call. Each becomes a template in the mail provider. The `kind` decides the sending stream
and whether an unsubscribe link is required.

| Message | Kind | Sent by | To |
|---|---|---|---|
| Your sign-in link (and six-digit code) | transactional | `requestSignInLink()` | shopper |
| Your code: (the offer) | transactional | `claimCode()` | shopper |
| Confirm your weekly specials e-mail | transactional | `subscribe()` | subscriber |
| [Test] (campaign subject) | marketing | `sendTest()` | staff address |
| (Campaign subject) | marketing | `sendNow()`, `sendDue()` | the campaign's audience |
| There's an update on your application | transactional | `sendOffer()`, `markNotSelected()` | applicant (never says the outcome) |
| Thank you for your feedback (ref) | transactional | `submitFeedback()` | customer, when they gave an address |
| About your feedback (reply) | transactional | `addFeedbackMessage()` (outbound) | customer |
| We have your request (ref) | transactional | `submitRequest()` | requester |
| Your request (ref) (reply) | transactional | `addRequestMessage()` (outbound) | requester |
| (Staff update), [Test], [Reminder] | internal | `sendStaffUpdateNow()`, `sendDueStaffUpdates()`, `sendStaffTest()`, `remindStaffUpdate()` | staff at the chosen stores |

The `OutboxMessage` row (`lib/types.ts`) already carries `to`, `kind`, `subject`, `body` lines, an optional `action`
button, and links back to its campaign or staff update. That is the provider payload. Keep the table in production as
the send log, with the provider's message id and delivery status added.

Not sent today, and expected:

- applicant sign-in links;
- staff invitations;
- password resets;
- a "your application was received" confirmation;
- a reminder before a staff document expires.

## 3. Things kept in the browser

From [generated/externals.md](generated/externals.md):

| Key | What | Production |
|---|---|---|
| `sfb-data-v1` | the whole demo data set | gone: the database |
| `sfb-session-v1` | the demo session | gone: the auth cookie |
| `sfb-apply-draft-<job id>` | application drafts | keep in the browser, or save drafts on the server once the applicant has an account |
| `sfb.staffSkin`, `sfb.staffGlass`, `sfb.staffTheme`, `sfb.navClosed`, `sfb-flow-*` | screen preferences | keep in the browser (or per user) |
| `sfb-till-branch` | which store a till is set to | move to the grant or the device registration |
| `sfb-signin-times`, `sfb-signup-times` | browser-tab rate limits | replace with server limits |
| `sfb-banner-dismissed`, `sfb-outbox-to`, `sfb-tour-v1` | demo only | remove |

## 4. Decisions needed

| # | Decision | Recommendation |
|---|---|---|
| D1 | Database and sign-in provider | Supabase (Postgres, Auth, Storage, row-level security, cron) |
| D2 | Mail provider | One provider with transactional, marketing and internal streams (for example Postmark or Resend), on a sending domain the company owns, with SPF, DKIM and DMARC |
| D3 | Where shifts and payslips come from | Ask the company what it uses today |
| D4 | Social media figures: live API or manual entry | Live API, once the company grants access to its accounts |
| D5 | Website changes: live on save, or held until Publish | Live on save for hours and notices; held for the season look and home bands (the Website studio already has a preview) |
