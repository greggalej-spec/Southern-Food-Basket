# Recurring checks

The audit is only useful if it stays true while the app keeps changing. Two things keep it true.

## 1. The wiring check (every push)

`flows-and-wiring/tools/wiring-audit.mjs` reads the source with the TypeScript compiler and rebuilds every inventory
in `generated/`. Then it checks the rules below and compares the result with `registry.json`, the accepted wiring.

| Command | What it does |
|---|---|
| `npm run wiring` | Regenerate `generated/` and print a summary |
| `npm run wiring:check` | The same, then fail (exit 1) on a new finding or on drift |
| `npm run wiring:accept` | Accept the current wiring: rewrite `registry.json` |

**It runs on every push and pull request** through `.github/workflows/wiring.yml`, after the type check and lint. It is
read-only: it never deploys, commits or pushes. Locally it takes a few seconds.

### The rules it enforces

| Finding | Meaning |
|---|---|
| `unguarded-write` | A function that changes data with no permission check, and not listed in `public-writes.json` as a public, self-service or scheduled write |
| `unaudited-write` | A change that leaves no audit line |
| `unused-write` | A write no screen reaches |
| `screen-writes-directly` | A screen component that changes data itself instead of through `lib/` |
| `perm-unassigned`, `perm-unchecked`, `perm-undefined` | A permission no role holds, one nothing checks, or one checked but never defined |
| `nav-gate-mismatch` | The sidebar shows a console section to people the section itself refuses, or the other way round |
| `route-ungated-staff-writes` | A page with no sign-in gate that offers writes needing a staff permission |
| `secret` | Something that looks like a live credential in the source (the repository is public) |

### Drift

Drift is any change to:

- the list of routes, console sections or collections;
- the permissions, or any role's permissions;
- the writes, or a write's permissions, audit lines or collections;
- the outside hosts named in the code;
- the browser storage keys.

Drift is not wrong. It means "the wiring changed; someone should look before it is accepted".

### When the check fails

1. Read `generated/report.md` (or the job's log). It lists each new finding and each drift line.
2. For a **new finding**, choose one:
   - Fix the code. This is usually the answer: add the missing `assertCan` or `audit`.
   - If the write is meant to be public, self-service or scheduled, add it to `public-writes.json` with the reason and
     with what replaces the permission check (a token, ownership of the record, the scheduler).
   - If it is a real gap to fix later, add it to `known-gaps.json` with an id from `05-gaps-and-recommendations.md`
     and a status.
3. For **drift**:
   - Check that the new screen or write is in the right place in `02-screens-and-flows.md`.
   - A new collection or relationship belongs in `04-backend-wiring-plan.md`.
   - A new outside host belongs in `03-integrations.md`.
   - Then run `npm run wiring:accept` and commit `registry.json` with the change.

`known-gaps.json` and `registry.json` are part of the code. Change them in the same commit as the code they describe.

## 2. The scheduled review (weekday mornings)

A scheduled Claude task, **"Southern Food Basket wiring review"**, runs at 8:00 every weekday on this computer while the
Claude app is open. If the app is closed, it runs the next time the app opens. It:

1. runs the wiring check in the `next-rebuild` worktree;
2. stops with a one-line note when nothing has drifted and there are no new findings;
3. otherwise, reads the code behind each change and updates the hand-written documents (01 to 05) to match;
4. writes a dated report in `flows-and-wiring/reports/` with:
   - what changed;
   - what it updated;
   - what it recommends accepting;
   - what needs a decision.

It never accepts drift itself (that stays a human decision, so the check keeps meaning something), and it never
commits, pushes or deploys. Its changes wait in the working tree for review.

To change its time, pause it or run it now, use the Scheduled tasks list in the Claude app.

## 3. Keeping the tool honest

The tool reads code, so it can be fooled by patterns it does not know. Known limits:

- **Permission checks:** it follows calls and re-exports, and counts a `can()` check inside a lib helper. A check
  built from a variable name counts only where the variable's values are written in the code.
- **What a change touches:** it follows rows looked up from a collection, helpers given the data set or a row, and
  callbacks given a row. A write that changes data some other way shows an empty "Changes" column. Five writes do so
  today, all for good reasons: two exports, two read receipts, and the generic `updateEmployee` helper.
- **Personal fields:** found by field name, so a new field with an unusual name needs adding to the `PII` pattern.

When the tool is wrong, fix the tool, not the finding. It is one file, commented throughout.
