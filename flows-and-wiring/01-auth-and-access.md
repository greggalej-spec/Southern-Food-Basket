# Authentication and access

Who can get in, how they prove who they are, and what they may do once in. Section 1 is how the demo works today,
section 2 the access model (which is already production-shaped), section 3 what the real app needs, section 4 the
work list. Source references are to `lib/` and `components/`; the role matrix itself is generated in
[generated/permissions.md](generated/permissions.md).

## 1. Who signs in today, and how

Five kinds of visitor reach the app. None of them is really authenticated: the demo stores a session object
(`{ role, userId, at }`) in the browser under `sfb-session-v1` (`lib/store.ts` `login()`), and whatever that object
says is believed.

| Who | Where | How it works in the demo | What would prove identity in production |
|---|---|---|---|
| Staff (employee, HR, administration, Point of Sale, marketing, Managing Director) | `/portal` (`components/portal/login.tsx`) | Work e-mail (any staff member with live access) and any password, then a six-digit code that is printed on the screen (`482615`). Or one tap on a demo account card (added 16 Nov 2026, "for now"). `?as=<role>` signs straight in. | Password plus a second factor, or a sign-in link to a verified work address; MFA required for HR, administration and the Managing Directors (PRD ADM-010) |
| Applicants | `/careers/<id>/apply` then `/careers/me` | Submitting an application signs the applicant in (`apply-form.tsx` `login("applicant", id)`). There is no way back in later except the demo card on the staff sign-in page. | A sign-in link or code sent to the address on the application |
| Shoppers (members' offers) | `/account/sign-in`, `/account/verify` (`lib/account.ts`) | Passwordless: a sign-in link (15 minutes) and a six-digit code, sent to the demo outbox. Three requests per ten minutes per browser tab. The reply is the same whether or not an account exists. | The same design, with the link and code sent by a real mail service and the rate limit enforced per address and per IP on the server |
| Newsletter subscribers | `/newsletter/confirm`, `/preferences`, `/unsubscribe` | A token in the e-mailed link is the only credential. No account. | Signed, single-purpose tokens: confirmation expires; unsubscribe never needs a sign-in (the law requires one click) |
| The public | Every other page | No sign-in | Nothing |

Also in the demo, and never in production:

- The guided tour (`lib/tour.ts`) writes the session directly to switch people.
- `/outbox` shows every e-mail the system "sent", to anyone.
- "Reset demo" wipes the browser's copy.
- The session never expires.

### Sign-out

`logout()` clears the session. `lib/portal/login.ts` holds the routing: each role has a home (`ROLE_HOME`) and an area
(`ROLE_AREA`); a `?next=` link is honoured only inside the role's area and only after `safeNext()` has parsed it (it
rejects anything that would leave the site). Keep both rules in production.

## 2. The access model (keep it)

This part is already designed the way a real system needs it, and it is pure code with no browser dependency
(`lib/access.ts`), so the server can run the same file.

**Roles and permissions.** 38 named permissions (`PERMISSIONS`) and a matrix of which role holds which
(`ROLE_PERMS`). Least privilege throughout: marketing never sees applicants, HR never sees the mailing list,
Point of Sale (the `purchasing` role in code) can view the supplier specials and nothing else, and change nothing, and even the Managing Directors do not hold the HR
permissions.

**Grants.** A role is held through a grant (`Grant` in `lib/types.ts`):

- the person and the role;
- the stores it covers (`branchIds`, null for every store);
- an optional end date (`expires`);
- extra permissions on top of the role (`extra`, used for till access, `codes.redeem`);
- who gave it and when;
- whether it was revoked, by whom, and why (the reason is kept in the audit line).

A staff session counts only while its grant is live (`activeGrant`, `sessionValid`). So revoking a grant ends that
person's access on their next action, in every open tab.

**Checks at the point of change.** Every staff write calls `assertCan(data, session, permission, { branchId })`
inside `update()`, before it changes anything. A refusal throws, nothing is written, and the console logs the refusal
(`lib/admin/guard.ts` `attempt()`). Store-limited people are also checked with `assertInScope`. The generated
[writes table](generated/writes.md) lists the permission behind every write.

**Rules beyond the matrix.** Kept in code and worth keeping:

- Nobody changes or revokes their own Managing Director grant, and the last live one cannot be revoked, limited or
  given an end date (`lib/admin/access-admin.ts` `lockoutBlock`).
- Whoever drafted a promotion cannot approve it (`lib/promo.ts` `approveBlock`).
- A promotion that runs at stores outside the approver's scope needs someone with every store.
- An employee may only tick off their own tasks (or hold `tasks.assign`); may only read and acknowledge staff updates
  sent to them (`own()` in `lib/staff-updates.ts`).
- HR's private notes and decision reasons never reach the applicant, the timeline or the audit log.

**Screen gates are not security.** Three layers hide what a person cannot use:

- the page gate (`useRequireRole`, which sends them to sign in);
- the console section gate (`TAB_PERMS` in `lib/admin/helpers.ts`);
- the sidebar filter (`navFor` in `components/app-shell.tsx`).

They shape the screens. Only the write checks protect data, and in production only server-side checks do. The
audit tool compares the sidebar with the section gates on every run.

## 3. What the real app needs

### 3.1 Identity

Recommendation (decision needed, PRD section 13 leaves the provider open): **Supabase Auth** with Postgres row-level
security, because the rebuild plan already leans that way (`docs/plan/rebuild-nextjs-shadcn.md` item 5: TradeLynq runs
on it) and because it gives sign-in links, one-time codes, MFA, and the database policies in one place.

| Who | Method | Session |
|---|---|---|
| Staff | E-mail and password plus TOTP (authenticator app) or SMS code; MFA required for `hr`, `admin`, `owner` | HttpOnly cookie, 12 hours, re-authentication for access changes (PRD 4.1) |
| Applicants | Sign-in link or six-digit code to the application's address | Cookie, 30 days |
| Shoppers | Sign-in link or code (as built) | Cookie, 30 days |
| Subscribers | Signed tokens per action | None |

Staff accounts are provisioned by the Managing Directors (Staff access → Give access), never self-registered (PRD
"explicitly provisioned"). HR's "Add a person" today also creates an employee grant (`lib/hr/people.ts` `addPerson`);
in production that sends the new person an invitation.

### 3.2 Authorisation on the server

Two layers, both from the same matrix:

1. **Server functions** (Next.js server actions or route handlers) run the existing write helpers' checks with the
   session taken from the cookie, never from the request body. The `assertCan` and `assertInScope` calls stay exactly
   where they are; only `session()` changes source.
2. **Row-level security** on every table, so a bug in a server function still cannot leak rows. Policies are
   generated from `ROLE_PERMS` plus the grant's store scope (a `has_perm(perm, branch_id)` SQL function that reads
   the caller's live grant). Self-service rows (an applicant's own application, an employee's own leave, a shopper's own
   codes) get ownership policies: `owner_id = auth.uid()`.

Reads matter as much as writes. Today every page is sent all the data it might need (section 3.4). In production each
screen fetches only what its role may read; the generated [screens table](generated/screens.md) lists what each screen
reads, which is the list of queries to write and to protect.

### 3.3 Sessions, revocation and audit

- Revoking a grant must end the person's access at once. Check the grant on every server request; it is one indexed
  lookup. That matches the demo's behaviour.
- Expired grants (`expires`) need no job: the check compares the date.
- The audit log is written by the server, append-only, with no cap. The demo keeps the last 400 rows
  (`AUDIT_CAP`). Never write a full code, an e-mail address or a document into it; the demo already follows this rule.
- Sign-ins, failed sign-ins and refusals are audited, as the demo does (`auth.signin`, refused writes).

### 3.4 Data that must stop reaching the browser

`lib/private.ts` joins the staff, members and mailing data to the browser's copy on every staff and applicant page.
That is fine for a demo and unacceptable in production. It means an applicant's browser receives every employee's
record, the mailing list and the supplier cost sheets. The fix is the per-screen queries in 3.2; nothing in the screens
needs to change beyond reading through server data instead of `useData()`.

## 4. Work list

| # | Task | Depends on |
|---|---|---|
| A1 | Choose the provider (recommended: Supabase Auth) and set up staff, applicant and shopper sign-in | Decision |
| A2 | Replace `session()` / `login()` / `logout()` in `lib/store.ts` with the provider's session; keep the `Session` shape (`role`, `userId`) so every check keeps working | A1 |
| A3 | Add the grant tables and a `has_perm` SQL function; write row-level security policies from `ROLE_PERMS` and the ownership rules above | A1, tables (04) |
| A4 | Give applicants a way back in (sign-in link to the application address) | A1 |
| A5 | Remove every demo shortcut: `?as=`, the one-tap cards, the on-screen code, the tour's session writes, `/outbox`, "Reset demo" | A2 |
| A6 | MFA for `hr`, `admin`, `owner`; re-authentication before access changes | A1 |
| A7 | Server-side rate limits for sign-in links, sign-ups, applications, feedback and request forms | A1 |
| A8 | Close the unchecked writes in `05-gaps-and-recommendations.md` G1 and G3 before any of this goes live | none |
