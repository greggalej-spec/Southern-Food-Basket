# Gaps and recommendations

Part 1 is what is wrong or missing in the wiring today, ranked, each with its evidence and fix. The ids (G1, G2…)
match `known-gaps.json`, so the automatic check tracks each one until it is closed. Part 2 covers areas the project
has not addressed yet beyond the wiring.

Severity is for the production app. In the demo, with demo data in one browser, none of these exposes anything real.

## Part 1. Wiring gaps

| # | Severity | Gap | Evidence | Fix | When |
|---|---|---|---|---|---|
| G1 | High | HR actions with no permission check: verify or flag an applicant's document, schedule an interview, open or close a job, add a private note, approve or refuse leave | `lib/hr/hr.ts` `verifyDoc`, `flagDoc`, `scheduleInterview`, `setJobStatus`; `lib/store.ts` `addNote`, `setLeaveStatus` (check: `unguarded-write`) | Add `assertCan`: `hr.pipeline` with the job's store for applicant actions, `hr.jobs` for jobs (the permission exists and nothing checks it), `hr.compliance` with the person's store for leave | Before phase 1 ends; a small change |
| G2 | Medium | Changes with no audit line: the G1 actions, applicant record and stage changes, staff document changes, leave and swap requests, profile edits | `unaudited-write` findings (16, two of them accepted) | Add an audit line to each, never including document contents, note text or bank details | With G1 |
| G3 | High | Writes shared by two kinds of person with no check at all: `updateApplicant`, `setStage`, `setDocState`, `addMessage`, `setEmployeeDoc` | `lib/store.ts`; called from both the applicant's or employee's page and HR's screens | Split each into a self-service write (own record only) and an HR write (`hr.pipeline` or `hr.compliance`) | Phase 1 |
| G4 | Medium | The applicant page writes to the store itself instead of through a lib write | `components/careers/me-dashboard.tsx` `MeView` (`screen-writes-directly`) | Move it into a named write in `lib/hr/` or `lib/careers/` | Phase 1 |
| G5 | High | Scheduled newsletters and staff updates go out only when somebody opens the right screen | `sendDue()` called from `newsletter-panel.tsx`; `sendDueStaffUpdates()` from two screens | A cron job (04, section 5) | Phase 6 |
| G6 | High | A hired applicant never becomes a staff member: no employee record, no portal sign-in, no documents carried over | No code turns `stage: "hired"` into an employee | On acceptance (or when HR confirms the start date), create the employee from the application, carry the verified documents across, and create the employee grant: one HR action, `hr.people` | Phase 4 |
| G7 | Critical in production | No real sign-in; demo shortcuts sign anyone in as anyone; all staff, applicant, member and mailing data is shipped to every staff and applicant browser | `01-auth-and-access.md` sections 1 and 3.4 | Work list A1 to A7 | Phase 1 onward |
| G8 | Medium | People referenced by name as text, so renames orphan old records | `applicants.notes.author`, `applicants.messages.from`, `requests.owner`, `plan.owner` ([generated/relationships.md](generated/relationships.md)) | Store a staff or applicant id; show the current name | During the table design |
| G9 | Medium | Nothing reminds anyone: documents about to expire, leave waiting for HR, requests near their needed-by date, stores that have not answered a bulk order, overdue tasks | Dates are shown on screens only | A daily job that e-mails the owner of each item; the Today screen already lists them | Phase 4 to 6 |
| G10 | High in production | Rate limits exist only per browser tab; public forms have no spam protection | `sfb-signin-times`, `sfb-signup-times` in session storage | Server rate limits per IP and per address; Turnstile or hCaptcha on the public forms | Phase 8 |
| G11 | Medium | The audit log keeps only the last 400 entries | `AUDIT_CAP` in `lib/store.ts` | Server audit table, append-only, no cap, with a retention period set by policy | Phase 1 |
| G12 | High | No automated tests and no CI | No test files, no `.github/` | Add the recurring check now (06); unit and contract tests with the move (04, section 8) | Now |
| G13 | High | Files are never stored: documents, workbooks, attachments, flyers keep only name, size and type | `DocRecord`; file pickers on 7 screens | Private storage with signed URLs and a virus scan; public storage and CDN for flyers | Phase 3 |
| G14 | Low | Shifts and payslips have no source: seed data only, with no screen or import that creates them | `employees.shifts`, `employees.payslips` | Decision D3 | Phase 4 |
| G15 | Low | Social figures and connections are simulated | `socialWeeks`, `setConnected()` only flips a flag | Meta and TikTok APIs (03) | Phase 7 |
| G16 | Low | No role holds till access by default | `perm-unassigned:codes.redeem` | Intended: the Managing Directors grant it per person. Keep. | Accepted |

### How to close one

1. Fix the code.
2. Run the check:

```bash
node flows-and-wiring/tools/wiring-audit.mjs --check
```

It reports the finding under "Accepted findings that no longer occur".

3. Delete its line from `known-gaps.json`.
4. Run `--update` to accept the new wiring.

The fix for G1 to G4 touches access control. Per the project rules, it needs Gregg's approval before it is made.

## Part 2. Areas not yet covered

Beyond the wiring itself, what a production launch of this app still needs.

### Security

- A short threat model for the four sensitive areas: HR files, applicant documents, members' codes and staff access.
  The PRD lists "Hiring data exposure" as its only Critical risk.
- Security headers: Content-Security-Policy, HSTS, frame-ancestors. Upload limits by type and size; scan every upload.
- Secrets in the host's environment settings only. The repository is public: nothing secret may ever be committed,
  and the check scans for keys on every run.
- Backups with a tested restore, and point-in-time recovery for the database.
- Dependency updates: Dependabot or Renovate on the repository.

### Privacy and legal (Trinidad and Tobago)

- A privacy notice covering applicants, staff, shoppers and subscribers. The Data Protection Act 2011 is only partly
  in force; follow its principles anyway: purpose, consent, retention, access, correction.
- Retention periods:
  - unsuccessful applicants' documents;
  - former staff files;
  - the audit log;
  - the outbox;
  - consents (kept, as proof).
- A way for a person to see and delete their data. Shoppers can already delete their account; applicants cannot.
- Permission to use the company's logo and photos. The concept uses them without permission (CLAUDE.md), and that
  must be settled before anything goes public.

### Reliability and operations

- Separate development, staging and production environments, each with its own database and mail stream.
- Error monitoring and uptime checks, with alerts going to a named person.
- Database migrations in the repository, applied by CI to staging and by approval to production (existing rule: no
  unattended production deploys).
- The till page on a weak connection: decide what happens when a code check cannot reach the server (refuse, and say
  so plainly).

### Quality

- Validation written once and used by both the screen and the server (for example shared schemas). Today checks such
  as "the last day is before the first day" live inside the writes, which is the right place, but they must run on the
  server.
- Automated accessibility checks in CI (axe), at the project's test widths of 375 and 910 px. The contrast rule
  (4.5:1) is a project rule already.
- A performance budget for the staff consoles on an iPad. The 16 Nov 2026 slowdown came from animation, not data, and
  is a pattern to guard against.

### Product gaps found along the way

- Applicants cannot sign back in, and cannot see or delete their data after applying (A4).
- No "we received your application" e-mail.
- No staff invitation or password reset e-mails.
- The flows guide (`lib/flows.ts`, `/how-it-works`) is good staff documentation. Keep it in production behind the
  staff sign-in, and keep it in step with the screens; the check regenerates [generated/flows.md](generated/flows.md)
  from it.
