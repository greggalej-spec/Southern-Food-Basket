# Flows and wiring

Everything the Southern Food Basket app does, mapped so it can be connected to a real database, real sign-in and real
e-mail in the least time once the screens are signed off. Started 16 Nov 2026 on branch `department-dashboards`.

The app today is a complete front end with no back end: every screen works, but all data lives in the visitor's browser
(`lib/store.ts`, localStorage), sign-in is a demo, and e-mails land in the demo outbox at `/outbox`. That design is what
makes this audit possible: every change to data already goes through one function (`update()`), and almost every staff
change already checks a named permission (`assertCan`) and writes an audit line (`audit`). Wiring the back end means
replacing that one layer, not rewriting the screens.

## What is in this folder

| File | What it answers |
|---|---|
| [01-auth-and-access.md](01-auth-and-access.md) | Who can sign in, how, what each role may do, and what must move to the server |
| [02-screens-and-flows.md](02-screens-and-flows.md) | Every area of the app walked through: the screens, what each step changes, what it depends on, and what it needs wired |
| [03-integrations.md](03-integrations.md) | Every outside service the real app needs (e-mail, file storage, maps, social media, scheduling) and what calls it |
| [04-backend-wiring-plan.md](04-backend-wiring-plan.md) | The tables, the server functions, the order of work, and how to cut over without touching the screens |
| [05-gaps-and-recommendations.md](05-gaps-and-recommendations.md) | What is missing or unsafe, ranked, with the fix for each, plus the areas the app has not covered yet |
| [06-recurring-checks.md](06-recurring-checks.md) | The automatic check that keeps all of this true as the app changes, and how to use it |
| `generated/` | Inventories written by the audit tool from the source code. Never edit by hand. |
| `registry.json` | The accepted wiring: the snapshot the check compares against |
| `known-gaps.json` | Findings already known, each with its reason and status |
| `public-writes.json` | Writes that are meant to work without a staff permission (public forms, a person's own record, scheduled jobs) |
| `tools/wiring-audit.mjs` | The audit tool |

### The generated inventories

| File | Contents |
|---|---|
| [generated/screens.md](generated/screens.md) | Every page and console section: who can open it, what it reads, every change it can make (with permission and audit line), where it links |
| [generated/writes.md](generated/writes.md) | Every function that changes data: its permission, store scope, audit line, the collections it changes and reads, and the screens that call it. This is the future API. |
| [generated/data-model.md](generated/data-model.md) | Every data collection: its row type, what changes it, which screens read it, and its personal fields |
| [generated/relationships.md](generated/relationships.md) | Every field that points at another collection (the future foreign keys), and what depends on each collection |
| [generated/permissions.md](generated/permissions.md) | The role and permission matrix, where each permission is checked, and the sidebar against the section gates |
| [generated/externals.md](generated/externals.md) | Outside hosts named in the code, browser storage keys, network calls |
| [generated/flows.md](generated/flows.md) | The business processes as the app describes them to staff (from `lib/flows.ts`) |
| [generated/report.md](generated/report.md) | The latest findings and drift |

## The app in numbers (16 Nov 2026)

| | |
|---|---|
| Source files read | 222 |
| Pages (routes) | 36 |
| Console sections | 33 (26 in the office console, 7 in the HR console) |
| Functions that change data | 113 |
| Data collections (future tables) | 44 |
| Permissions | 38, across 8 roles |
| Network calls to any server | 0 |
| Findings | 30 known (11 high, 18 medium, 1 low), 0 new |

## Readiness in one paragraph

The front end is ready to be wired. The data layer is clean and centralised, permissions are named and mostly checked
at the point of change, audit lines exist for most staff actions, personal fields are identifiable, and the screens
never talk to storage directly except in two places. What is not ready: there is no real authentication of any kind,
everything (including other people's data) is shipped to the browser, scheduled jobs only run when someone opens a
page, files are never stored, and a group of older HR and employee-portal writes skip the permission and audit
discipline the rest of the app follows. All of it is listed, with fixes, in `05-gaps-and-recommendations.md`.

## Run it

```bash
node flows-and-wiring/tools/wiring-audit.mjs
```

```bash
node flows-and-wiring/tools/wiring-audit.mjs --check
```

The first regenerates `generated/` and prints a summary. The second does the same and fails when something new
appears that nobody has looked at. Details, and what to do when it fails, are in `06-recurring-checks.md`.
