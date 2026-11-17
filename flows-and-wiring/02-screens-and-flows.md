# Screens and flows

Every area of the app, walked end to end. Each section names the screens involved, every step that changes data (the
write function, the permission it checks, what it changes), what the step depends on, anything that happens on a
clock, anything sent outside, and what has to be wired. The exhaustive per-screen detail (every component, every read,
every link) is generated in [generated/screens.md](generated/screens.md); the per-write detail in
[generated/writes.md](generated/writes.md). This file is the map between them.

Conventions: `write()` is a function in `lib/`; **perm** is the permission it checks; "changes" lists collections
(future tables). "Self" means a person acting on their own record; "public" means anyone.

## Contents

1. [Public site](#1-public-site)
2. [Members' offers and codes](#2-members-offers-and-codes)
3. [Weekly e-mail (newsletter)](#3-weekly-e-mail-newsletter)
4. [Hiring](#4-hiring)
5. [HR: people, files and compliance](#5-hr-people-files-and-compliance)
6. [Employee portal](#6-employee-portal)
7. [Office: supplier specials and sell-out reports](#7-office-supplier-specials-and-sell-out-reports)
8. [Office: requests, feedback, bulk orders, tasks](#8-office-requests-feedback-bulk-orders-tasks)
9. [Website management](#9-website-management)
10. [Marketing](#10-marketing)
11. [Staff updates and notices](#11-staff-updates-and-notices)
12. [Managing Directors: overview, approvals, access, audit](#12-managing-directors-overview-approvals-access-audit)
13. [Demo-only screens](#13-demo-only-screens)
14. [Cross-cutting dependencies](#14-cross-cutting-dependencies)

---

## 1. Public site

**Screens:** `/` (the Grand Entrance home), `/specials`, `/departments`, `/locations`, `/events`, `/community`,
`/restaurant`, `/wholesale`, `/about`, `/offers`, `/offers/[slug]`, `/careers`, `/careers/[id]`, `/how-it-works`.
Two layouts wrap them and add the site-wide Feedback button and the season layer.

**Reads:** `settings`, `branches` (hours, phones, addresses), `departments`, `specials`, `flyers`, `events`,
`promotions` (only `publicPromos()`: approved and started), `jobs` (open only), `site` (season, notice bar, home
bands), `content`.

**Writes from public pages:**

- `submitFeedback()` (public): the Feedback button. Changes `feedback`, `outbox`, `audit`. Sends a thank-you e-mail
  when the contact is an address.
- `submitRequest()` (public): the community request form. Changes `requests`, `outbox`, `audit`. Sends "We have your
  request (ref)".
- `subscribe()` (public): the weekly e-mail sign-up (section 3).
- `addApplicant()` (public): job applications (section 4).

**Depends on:**

- Store hours and phones come from Stores and hours (`saveStore()`, section 9).
- Specials come from the Specials editor (`saveDeal()`), fed by the supplier specials (section 7).
- Events and flyers come from Events and flyers (section 9).
- The season, notice bar and home bands come from Customize and the Website studio.
- Offers come from Promotions (section 2).

**Clock:** the season shows between its dates (`activeSeason`); events show between `from` and `to`; offers by
`promoState` (section 2).

**Outside:** OpenStreetMap tiles on `/locations` (Leaflet); Google Maps links per store (`placeId`); Instagram,
Facebook, TikTok and WhatsApp links.

**To wire:**

- Public pages read from the database through cached server queries. The data is public, but drafts must never be
  selected: the filters in `publicPromos()`, open jobs and event dates move into the queries.
- Revalidate the cache when a staff write changes public data.
- Rate-limit and spam-filter the two public forms.
- The home page is generated (`tools/grand-entrance/build.js`); keep it static.

## 2. Members' offers and codes

**Screens:** `/offers`, `/offers/[slug]` (shopper), `/account` (wallet), `/account/sign-in`, `/account/verify`,
`/portal/till` (staff with till access), `/admin#promos`, `/admin#codes`.

**Lifecycle of an offer:**

| Step | Write | Perm | Changes |
|---|---|---|---|
| Draft or edit | `savePromo()` | `promos.draft` | promotions |
| Send for approval | `submitPromo()` | `promos.draft` | promotions |
| Approve or send back | `decidePromo()` | `promos.approve` (not the drafter; whole scope) | promotions |
| End early | `endPromo()` | `promos.approve` | promotions |
| Archive | `archivePromo()` | `promos.approve` or `promos.draft` | promotions |
| Shopper signs in | `requestSignInLink()`, `verifySignInLink()` / `verifyOnce()` | public | customers, outbox |
| Shopper claims a code | `claimCode()` | self | entitlements, customers, outbox |
| Cashier checks the code | `redeemCode()` | `codes.redeem` (an extra on the grant) and the till's store | entitlements, redemptions |

**Depends on:**

- A claim checks the promotion's state, its total cap, the per-shopper limit, and the shopper's store.
- A redemption checks the code, its promotion, the store the till is set to (`sfb-till-branch` in the browser), and
  the cashier's grant.
- Overview and Today show offers waiting for approval.

**Clock:** `promoState()` derives scheduled, live, full and ended from `starts` and `ends` at read time. No job is
needed, but the server must compute it with the server clock, never the browser's.

**Outside:** the "Your code" e-mail on claim; sign-in links.

**To wire:**

- Codes must be generated and checked on the server: unpredictable, never shown in full in any log (PRD 9.4). The
  claim and redemption limits become database constraints plus a transaction, so two tills cannot redeem one code.
- The till's store must come from the cashier's grant or device, not from session storage.

## 3. Weekly e-mail (newsletter)

**Screens:** the sign-up form (home and footer), `/newsletter/confirm`, `/newsletter/preferences`,
`/newsletter/unsubscribe`, `/admin#newsletter`, `/admin#list`.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Sign up | `subscribe()` | public | subscribers, consents, outbox |
| Confirm (double opt-in) | `confirmSubscription()` | token | consents, subscribers |
| Change topics or stores | `updatePreferences()` | token | consents, subscribers |
| Unsubscribe | `unsubscribe()` | token | consents, subscribers |
| Write a campaign | `saveCampaignScoped()` | `newsletter.compose` | campaigns |
| Send a test | `sendTestScoped()` | `newsletter.compose` | campaigns, outbox |
| Schedule or send now | `scheduleScoped()`, `sendNowScoped()` | `newsletter.send` | campaigns, outbox |
| Scheduled send | `sendDue()` | system | campaigns, outbox |
| Export the list | `exportSubscribersCsv()` | `subscribers.export` | audit only |

**Depends on:**

- The audience is computed from subscribers by status, topics and stores (`audience()`).
- Campaigns can feature a promotion (`campaigns.promoId`) and specials.
- Store-scoped staff can only send to their stores (the "Scoped" wrappers in `lib/admin/campaign-admin.ts`).

**Clock:** scheduled campaigns go out **only when someone opens the Newsletter section** (`sendDue()` is called from
`components/admin/newsletter-panel.tsx`). In production this must be a server cron job.

**Outside:** confirmation e-mails, test sends, campaign sends (marketing mail with an unsubscribe link and header).

**To wire:**

- A bulk mail provider with bounce and complaint webhooks that write back to `subscribers` (suppressed) and `consents`.
- Signed tokens.
- The cron job.
- The consent log kept forever (it is the legal record).

## 4. Hiring

**Screens:** `/careers`, `/careers/[id]`, `/careers/[id]/apply` (applicant); `/careers/me` (the applicant's own page);
`/hr#pipeline`, `/hr#roles`, `/hr#log` and the applicant drawer (HR).

| Step | Write | Perm | Changes |
|---|---|---|---|
| Apply (drafts saved in the browser per job) | `addApplicant()` | public | applicants |
| Upload or replace a document (applicant) | `setDocState()` | **none** (G3) | applicants |
| Move through stages | `moveStage()` | `hr.pipeline` (job's store) | applicants |
| Verify or flag a document | `verifyDoc()`, `flagDoc()` | **none** (G1) | applicants |
| Schedule an interview | `scheduleInterview()` | **none** (G1) | applicants |
| Private note, message to applicant | `addNote()`, `addMessage()` | **none** (G1/G3) | applicants |
| Offer or not selected (a sealed letter, and an e-mail that says only "an update") | `sendOffer()`, `markNotSelected()` | `hr.pipeline` | applicants, outbox |
| Applicant opens the update | `openOutcome()` | self | applicants |
| Accept or decline | `acceptOffer()`, `declineOffer()` | self | applicants |
| Open or close a job | `setJobStatus()` | **none** (G1; `hr.jobs` exists, unused) | jobs |

**Depends on:**

- Which documents are required comes from the job's department and whether the applicant is a national
  (`requiredDocsFor()`, `kycDocs`).
- The decision letter holds back anything newer until the applicant opens it (`lib/hr/outcome.ts`).
- Moving away from a decision withdraws it.

**Gap:** a hired applicant never becomes a staff member. Nothing copies them into `employees` or gives them a grant;
HR's "Add a person" is for people hired outside the website. See G6.

**Outside:**

- The "update on your application" e-mail.
- Document uploads, which today keep only the name, size and type, never the file.

**To wire:**

- Private file storage for documents (signed upload URLs, virus scan, expiring download links, PRD
  `application_documents`).
- Applicant sign-in (A4).
- Split the shared store writes by who is acting (G3).
- The hired-to-staff handover (G6).

## 5. HR: people, files and compliance

**Screens:** `/hr#people` (the team, each person's file in a drawer), `/hr#compliance` (documents, training, leave),
`/hr#resources`, `/hr#updates`.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Add a person (creates their portal sign-in) | `addPerson()` | `hr.people` (their store) | employees, grants |
| Change status, with reason (history kept) | `setPersonStatus()` | `hr.people` | employees |
| Note, praise, concern, warning | `addPersonNote()` | `hr.people` | employees |
| Rate work ethic, punctuality and four more | `addPersonRating()` | `hr.people` | employees |
| Verify or update a staff document | `setEmployeeDoc()` | **none** (G3) | employees |
| Approve or refuse leave (moves days into the used balance) | `setLeaveStatus()` | **none** (G1) | employees |
| HR checklists and forms | `saveResource()` | `hr.people` | resources |

**Depends on:**

- File alerts come from document states and expiry dates (`fileAlert()`, `docDisplayState()`).
- Leave balances come from the leave requests.
- The People search reads names, jobs, statuses and the text of notes (`fileText()`).

**Clock:** "expiring soon" is computed from dates at read time.

**To wire:**

- The HR file (`employees.hrFile`) is the most sensitive data in the system. It needs its own table, readable only
  with `hr.people` (never by the Managing Directors' role by default, per the matrix), encrypted at rest, and never
  in the audit text. The demo already keeps note text out of the audit log.
- Staff documents need private storage, like applicants'.

## 6. Employee portal

**Screens:** `/portal/home`, `/portal/schedule`, `/portal/leave`, `/portal/pay`, `/portal/docs`, `/portal/profile`,
`/portal/updates`, `/portal/till` (with till access), `/portal/bulk` (store managers).

| Step | Write | Perm | Changes |
|---|---|---|---|
| Ask to swap a shift | `requestSwap()` | self (no audit, G2) | employees |
| Ask for leave | `requestLeave()` | self (no audit, G2) | employees |
| Upload a document | `setEmployeeDoc()` | **none** (G3) | employees |
| Finish training | `setTrainingDone()` | self | employees |
| Edit own profile | `updateEmployee()` | self (no audit, G2) | employees |
| Read or confirm a staff update | `markStaffUpdateRead()`, `acknowledgeStaffUpdate()` | `portal.self`, recipients only | staffUpdates |
| Tick off own task | `setTaskDone()` | `portal.self` (own task) or `tasks.assign` | tasks |
| Store's quantity for a bulk order | `setBulkQty()` | `bulk.store` (store managers' extra) | bulkOrders |
| Check a member's code | `redeemCode()` | `codes.redeem` | entitlements, redemptions |

**Depends on:**

- Shifts, payslips and training are seed data today, with no screen that creates them. They will come from the
  rostering and payroll systems (see 03, "Not yet decided").
- Notices on the home page come from Staff notices (section 11).

**To wire:**

- Payslips and shifts need a source system and an import, or screens for HR to enter them.
- Bank details on the profile are masked in the demo (`bank.masked`). In production, store them encrypted and show
  only the last digits.

## 7. Office: supplier specials and sell-out reports

**Screens:** `/admin#suppliers`, `/admin#sellout`, `/admin#deals`, `/admin#posts`.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Open a round (book) | `addBook()`, `setBookStatus()` | `suppliers.edit` | specialsBooks |
| Add a supplier | `addSupplier()` | `suppliers.edit` | suppliers |
| Bring in sheets (Excel workbook, CSV, or pasted message text, read in the browser) | `importSheets()` | `suppliers.edit` | supplierSheets, suppliers |
| Edit or remove a line, case price, star a key line, mark the sheet checked | `saveLine()`, `removeLine()`, `setCasePrice()`, `toggleKey()`, `setSheetChecked()` | `suppliers.edit` | supplierSheets |
| Record a sell-out report, attach the page, mark it sent | `saveSellout()`, `markSelloutSent()` | `sellout.log` | sellouts |
| Put a special on the website | `saveDeal()`, `endDeal()`, `rerunDeal()`, `removeDeal()` | `specials.edit` | specials |
| Make an Instagram post from a special | (no write; draws an image in the browser and downloads it) | `posts.make` | none |

**Depends on:**

- Unit cost and margin are computed from the case price and the line.
- The key specials sheet gathers starred lines from every checked sheet.
- Sell-out reports are "owed" when a supplier that asks for them has lines in the round.
- Marketing draws posts and the website specials from checked lines.

**Sensitive:** supplier case prices and margins are commercially confidential. The real workbook must never be
committed to the public repository (an existing rule).

**To wire:**

- Keep Excel parsing in the browser (it already works offline) and send the parsed rows to the server, or parse on the
  server. Either way, keep the original file in private storage.
- Attachments for sell-out reports need storage.
- Post images could be generated on the server for consistency, but this is optional.

## 8. Office: requests, feedback, bulk orders, tasks

**Screens:** `/admin#requests`, `/admin#feedback`, `/admin#bulk`, `/portal/bulk`, `/admin#tasks`, `/admin#today`.

| Flow | Steps (write, perm) |
|---|---|
| Community requests | `submitRequest()` public, or `logRequest()` `requests.log` → `assignRequest()`, `moveRequest()`, `addRequestMessage()` `requests.log` (outbound messages e-mail the requester) → `decideRequest()` `requests.decide` (Managing Directors) |
| Customer feedback | `submitFeedback()` public → `assignFeedback()`, `setFeedbackStatus()`, `addFeedbackMessage()` `feedback.handle` (outbound e-mails the customer) |
| Bulk orders | `addBulkOrder()` `bulk.manage` → each store's `setBulkQty()` `bulk.store` → `advanceBulk()` `bulk.manage` (ordered, received) |
| Tasks and resources | `addTask()` `tasks.assign`; `setTaskDone()` (own task or `tasks.assign`); `saveResource()` `resources.edit` (HR forms: `hr.people`) |

**Depends on:**

- Today and Overview count what is waiting: requests with the directors, open feedback, bulk orders waiting on
  stores, tasks due.
- Today puts open store incidents first (`incidents`, read only; added 17 Nov 2026), for anyone with `office.desk` at
  that store. Each Today line carries an urgency: "critical" for an incident marked critical, "urgent" for anything due
  within two days or late (`URGENT_DAYS` in `lib/admin/today.ts`). The sidebar's lights (`lib/nav-signals.ts`) are worked
  out from the same lines, so they write nothing.
- Nothing yet reports or resolves an incident: the two rows are demo data (`lib/seed-incidents.ts`). The real app needs
  a way for a store to report one (a form or a call logged by the office), someone to take it, and a resolved state.
  See G17 in `05-gaps-and-recommendations.md`.
- A bulk order's total and cost add up from the store quantities.

**Clock:**

- A request's `neededBy` and a bulk order's answer-by date are shown, not enforced.
- Task due dates are shown.
- Nothing sends a reminder. See G9.

**To wire:**

- Inbound e-mail or WhatsApp for requests and feedback (today they arrive only through the forms or by hand entry).
- Request letters as attachments.
- Optional reminders.

## 9. Website management

**Screens:** `/admin#customize`, `/admin#studio`, `/admin#events`, `/admin#stores`, `/admin#publish`.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Season look, notice bar, home bands (each change keeps the version it replaced) | `saveSite()`, `applyLook()`, `restoreSiteVersion()` | `site.customize` | site, siteVersions |
| Events and promotions on the Events page; the main promotion banner | `saveEvent()`, `removeEvent()` | `events.manage` | events |
| Designer's flyers on the Specials page | `addFlyers()`, `setFlyer()`, `removeFlyer()` | `events.manage` | flyers |
| Store hours and phones | `saveStore()` | `stores.edit` | branches |
| Publish: download the public data file for the static site | `exportSeed()` | `site.publish` | audit only |

**Depends on:** every public page (section 1). Store hours are facts that must stay sourced (Google Maps, see
SITE.md).

**To wire:**

- With a database, Publish is no longer a download. Changes go live on save (with cache revalidation), or Publish
  becomes "push the approved changes live". Decide which (D5).
- Flyer images need storage and a CDN.

## 10. Marketing

**Screens:** `/admin#analytics`, `/admin#social`, `/admin#plan`, `/admin#posts`, `/admin#promos`, `/admin#codes`,
`/admin#newsletter`, `/admin#list`.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Connect or disconnect a social account (read-only) | `setConnected()` | `social.connect` | socialAccounts |
| Plan a post on the content calendar | `savePlanItem()`, `removePlanItem()` | `plan.edit` | plan |

**Depends on:** the figures (`socialWeeks`, `socialPosts`) are demo data. Nothing fetches them.

**To wire:**

- Meta (Instagram, Facebook) and TikTok business APIs: OAuth per account, tokens stored encrypted on the server, and
  a daily job that pulls the week's figures into `socialWeeks` and `socialPosts`.
- Connecting today only flips a flag.

## 11. Staff updates and notices

**Screens:** `/admin#staffnews`, `/hr#updates` (writers), `/portal/updates` (readers), `/admin#notices`,
`/portal/home`.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Write, test, schedule or send now, remind | `saveStaffUpdate()`, `sendStaffTest()`, `scheduleStaffUpdate()`, `sendStaffUpdateNow()`, `remindStaffUpdate()` | `staff.updates` (own stores) | staffUpdates, outbox |
| Scheduled send | `sendDueStaffUpdates()` | system | staffUpdates, outbox |
| Read, confirm | see section 6 | | |
| Post or remove a notice | `postNotice()`, `removeNotice()` | `notices.post` | announcements |

**Clock:** scheduled updates go out only when someone opens the staff updates screen or the portal's updates page.
This needs a cron job (G5).

**To wire:** internal e-mail through the same mail provider; recipient lists computed on the server from current
staff and their stores.

## 12. Managing Directors: overview, approvals, access, audit

**Screens:** `/admin#overview`, `/admin#today`, `/admin#access`, `/admin#audit`, plus everything their role holds.

| Step | Write | Perm | Changes |
|---|---|---|---|
| Give access (role, stores, end date) | `addGrant()` | `access.manage` | grants (and the person, if new) |
| Limit stores, set an end date, till access | `setGrantStores()`, `setGrantExpiry()`, `setTillAccess()` | `access.manage` (lockout rules) | grants |
| Revoke with a reason, restore | `revokeGrant()`, `restoreGrant()` | `access.manage` (lockout rules) | grants |
| Approve offers, decide requests | sections 2 and 8 | | |

**Depends on:**

- The overview reads nearly every collection.
- The greeting names every director with a live grant.
- The audit log reads `audit`.

**To wire:**

- The overview becomes a set of count queries; cache them per minute.
- The audit log moves to the server (01, section 3.3).
- Access changes require re-authentication (A6).

## 13. Demo-only screens

`/tour`, `/outbox`, `/how-it-works` (the flows explainer, which can stay as a staff guide), the concept banner, Reset
demo, the one-tap sign-in cards, and `?as=`. Remove or gate all of them before launch (A5).

## 14. Cross-cutting dependencies

The full list is generated in [generated/relationships.md](generated/relationships.md). The ones that bite:

| If this changes | These break or must follow |
|---|---|
| A store (`branches`) | jobs, employees, grants (scope), promotions, redemptions, requests, events, feedback, notices, social posts, shoppers' preferred store, subscribers' stores: 12 fields point at stores. Never delete a store; retire it. |
| A staff member (`employees`) | every `by`, `createdBy`, `approvedBy`, `assignedTo`, `grantedBy` field, and their grants. Never delete; mark as left (the HR status "Left the company" exists for this). |
| A person's name | `applicants.notes.author`, `applicants.messages.from`, `requests.owner`, `plan.owner` store the name as text, so a rename leaves old records naming someone who no longer exists (G8). |
| A promotion | its entitlements (codes) and any campaign featuring it. Archive, never delete. |
| A specials book or supplier | its sheets and sell-out reports |
| A job | its applicants. Close, never delete. |
| A document type (`kycDocs`) | every applicant's and employee's document list |
| The clock | offer states, event visibility, the season, grant expiry, "expiring soon" documents, scheduled sends. The server's clock decides in production. |
