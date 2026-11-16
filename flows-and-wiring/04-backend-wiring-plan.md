# Backend wiring plan

How to connect the finished front end to a real database, real sign-in, storage and mail, in the fewest steps and
without rewriting screens. It assumes decision D1 in [03-integrations.md](03-integrations.md) (Supabase). Every list
here is backed by a generated inventory, so nothing has to be rediscovered: the checklist **is** the generated files.

## 1. The shape of the change

Today:

```
screen component ── useData() ──────────────▶ lib/store.ts (localStorage)
screen component ── act(write()) ── lib write ── assertCan + update() + audit()
```

After:

```
screen component ── server query for that screen ──────────▶ Postgres (row-level security)
screen component ── act(serverAction()) ── the same lib write ── assertCan + transaction + audit row
```

What stays the same:

- the screens;
- the permission matrix (`lib/access.ts`, already pure);
- every write's checks, rules and audit wording;
- the `Session` shape (`role`, `userId`).

What changes:

- where `session()` comes from (the auth cookie);
- what `update()` does (a database transaction instead of a localStorage save);
- how a screen gets its data (a query per screen instead of the whole data set).

### Do it behind a switch

Introduce a small data adapter (`lib/data/`) with two implementations:

- `demo`: today's localStorage store, unchanged;
- `server`: server actions and queries.

Choose between them with one environment variable. This keeps the demo deployable for pitches while the server side
is built, lets each area move across on its own, and lets the same scenario run against both implementations as a
contract test.

## 2. Tables

The full list, with row types, personal fields and what reads and writes each, is in
[generated/data-model.md](generated/data-model.md). Child tables (lists kept inside a row today) are at the end of that
file; foreign keys are in [generated/relationships.md](generated/relationships.md).

| Group | Tables | Notes |
|---|---|---|
| Reference (rarely changes, mostly public) | `branches`, `departments`, `store_services`, `job_depts`, `kyc_docs`, `stages`, `settings`, `content`, `wholesale` | Branch facts must stay sourced (SITE.md). Seed from the verified data, not the demo. |
| Website | `site` (one row) and `site_versions`, `specials`, `events`, `flyers`, `site_pages` | Public read. Writes need `site.customize`, `specials.edit` or `events.manage`. |
| Access | `employees` (staff identity), `grants`, `audit` | `grants` drives every policy. `audit` is append-only (no update or delete for anyone). |
| Hiring | `jobs`, `applicants` and children `applicant_docs`, `applicant_notes`, `applicant_messages`, `applicant_timeline` | Documents point at private storage objects. Notes are HR-only. |
| HR files | `employee_leave_requests`, `employee_swap_requests`, `employee_shifts`, `employee_payslips` (with lines), `employee_training`, `employee_compliance`, `hr_notes`, `hr_ratings`, `hr_status_changes` | The HR file tables are readable only with `hr.people`. Encrypt bank details. |
| Members | `customers`, `customer_wallet`, `promotions`, `promotion_revisions`, `entitlements`, `redemptions` | Codes are unique and unpredictable. Claim and redeem run in one transaction each, with constraints for the caps. |
| Mailing | `subscribers`, `consents`, `campaigns`, `campaign_test_sends`, `outbox` | `consents` is the legal record: append-only and kept. `outbox` becomes the send log. |
| Staff comms | `staff_updates`, `staff_update_reads`, `staff_update_acks`, `announcements` | |
| Office | `suppliers`, `specials_books`, `supplier_sheets`, `supplier_lines`, `sellouts`, `sellout_lines`, `requests`, `request_messages`, `bulk_orders`, `bulk_allocations`, `bulk_log`, `tasks`, `resources`, `feedback`, `feedback_messages` | Supplier prices and margins are confidential: `suppliers.view` only. |
| Marketing | `social_accounts`, `social_posts`, `social_weeks`, `plan` | OAuth tokens live in a separate server-only table, never in `social_accounts`. |

Conventions:

- Keep the existing text ids (`emp-…`, `rq-…`, `uid()`) so demo data and links line up; add a UUID primary key only if
  the provider prefers one.
- Store every time as `timestamptz`. The demo writes local times with `-04:00`; Trinidad has no daylight saving, so
  the conversion is exact.
- Replace "a person's name stored as text" fields (G8) with ids during the move.
- `version`, `_tiers` and the private-tier merging in `lib/store.ts` disappear.

## 3. Server functions

[generated/writes.md](generated/writes.md) lists all 113 writes with the permission, store scope, audit line, the
tables each one changes and reads, and the screens that call it. Each row is one server action. The method for each:

1. Move the write's body into a server action that takes the same arguments minus the session (the session comes
   from the cookie).
2. Keep `assertCan` and `assertInScope` exactly as they are. They run on the server now.
3. Replace `update((d) => ...)` with a transaction that loads only the rows it touches (the "changes" and "also
   reads" columns) and writes back only what changed.
4. Keep the `audit()` call; it becomes an insert in the same transaction.
5. Replace `mail()` with an insert into `outbox`. A worker sends it, so a provider outage never loses a message or
   blocks the screen.
6. Make `act()` in `components/admin/bits.tsx` await the result. It already turns a refusal into a toast and logs it.

Public, self-service and system writes are listed in `public-writes.json` with what replaces the permission check: a
token, the signed-in person's ownership of the row, or the scheduler's service role.

## 4. Reads

[generated/screens.md](generated/screens.md) lists, for every page and console section, the collections it reads.
Each screen gets one server query (or a small set) that returns only what that role may see, shaped the way the
screen already uses it. Public pages use cached queries, revalidated when a staff write changes public data.

The overview and Today screens read nearly everything. Give them dedicated count queries rather than loading tables.

## 5. Jobs

| Job | Today | Production |
|---|---|---|
| Send scheduled newsletters | `sendDue()` when the Newsletter section opens | Cron every 5 minutes |
| Send scheduled staff updates | `sendDueStaffUpdates()` when an updates screen opens | Cron every 5 minutes |
| Send queued e-mail | sent instantly into the outbox | A worker drains `outbox` and records delivery |
| Bounces and complaints | none | Provider webhook writes `subscribers` and `consents` |
| Social figures | demo data | Daily pull per connected account |
| Document expiry reminders | shown on screens only | Daily: e-mail the person and HR 30 days before (new, G9) |
| Expired sign-in links and codes | expire by time | Nightly cleanup |

Offer states, event dates, the season and grant expiry need no job. They are computed from dates at read time, with
the server's clock.

## 6. Order of work

Each phase ends with its screens running on the server in a staging deployment while everything else still runs on
the demo adapter.

| Phase | Scope | Done when |
|---|---|---|
| 0. Decisions | D1 to D5 in 03; who owns the sending domain; where real data comes from | Written down in SITE.md |
| 1. Foundation | Data adapter switch; auth (staff first); `employees`, `grants`, `audit`; RLS helper `has_perm()`; fix G1 to G4 | Staff sign in for real; the access screens and audit log run on the server; the wiring check passes |
| 2. Public site | Reference and website tables; cached public queries; Customize, Studio, Events, Specials, Stores write to the server | Public pages render from the database; edits appear after revalidation |
| 3. Hiring | Jobs, applicants and children; private document storage; applicant sign-in; the decision e-mails through the outbox | An application goes from the form to "hired" on the server, with files stored and e-mails sent |
| 4. HR and portal | HR file, compliance, leave, training, staff updates, notices; the hired-to-staff handover (G6) | HR and an employee complete leave, documents and an update end to end |
| 5. Office | Supplier specials, sell-out, requests, feedback, bulk orders, tasks, resources | The office runs a round from workbook to website specials |
| 6. Members and mailing | Customers, offers, codes, till; subscribers, consents, campaigns; mail provider; cron jobs | A shopper claims a code, a cashier redeems it, and a campaign sends on schedule |
| 7. Marketing | Social OAuth and the daily pull; content calendar | Real figures on the marketing screens |
| 8. Hardening | Remove demo shortcuts (A5); rate limits; monitoring; backups; RLS tests; privacy notice and retention | Security review passed; the wiring check runs in CI on every push |

## 7. Data migration

- The demo seed (`lib/seed*.ts`) becomes the **staging** seed only. Demo people, applicants, subscribers and codes
  must never reach production.
- Production starts with reference data only:
  - stores from their Google Maps listings, as already sourced in SITE.md;
  - departments;
  - document types;
  - stages;
  - the content the company approves.
- Staff accounts are created by the Managing Directors from the real staff list.
- The supplier workbook stays out of the repository (an existing rule); it is imported through the screen.

## 8. Testing

There are no automated tests in the repository today. Add them with the move:

- **Unit:** `lib/access.ts` (the matrix, scope, lockout, separation of duties) and each write's refusal cases. These
  are pure functions and quick to test.
- **Contract:** the same scenario against the demo and server adapters (apply, decide, accept; claim, redeem; draft,
  approve, go live).
- **RLS:** for every table, a signed-in user of each role tries to read and write rows outside their access and must
  fail.
- **End to end:** one Playwright run per flow in 02, at 375 and 910 px (the project's test widths).
