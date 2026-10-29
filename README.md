# Southern Food Basket — concept site

An unsolicited prototype by Trinovata for Southern Food Basket, a supermarket-and-wholesale business in
south Trinidad. Not affiliated with the company. Version 2 (2026-10-23) uses the company's real logo, photos and
posted special prices from its public Instagram, in a traditional look aimed at older shoppers and millennials.
People, jobs, documents, hours and phone numbers are demo data. Sources: `SITE.md`; design law: `DESIGN.md`.

This branch (`next-rebuild`) is the same site ported to Next.js 16, Tailwind 4 and shadcn. Plan and port log:
`docs/plan/rebuild-nextjs-shadcn.md`.

## What is in it

| Area | Routes | Notes |
|---|---|---|
| Public site | `/`, `/specials`, `/departments`, `/wholesale`, `/locations`, `/about` | the home is the Grand Entrance scene |
| Hiring portal | `/careers`, `/careers/[id]`, `/careers/[id]/apply`, `/careers/me` | five-step application with a KYC document step; applicant dashboard |
| HR console | `/hr` | pipeline board, document review (verify / flag), roles, employee compliance |
| Store admin | `/admin` | specials, Instagram post maker, store hours, staff notices, publish |
| Employee portal | `/portal` (demo login), `/portal/home`, `schedule`, `leave`, `pay`, `docs`, `profile` | demo roles: Applicant, Employee, HR, Store admin |

No backend. State lives in `localStorage` through `lib/store.ts` (seed in `lib/seed.ts`); "Reset demo" in any footer
clears it. KYC "uploads" are previewed in the browser only; the store keeps file name, size, type and dates, never
bytes. The static site's `.html` addresses redirect to these routes (`next.config.ts`).

## Run

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000/ (the `sfb-next` entry in `Dev/.claude/launch.json` uses port 4176). After editing
`tools/grand-entrance/make-scene.js`, run `npm run scene` to rebuild `app/(home)/scene.ts`.

## Layout

```
app/(home)/             the Grand Entrance home (its own root layout); scene.ts is generated
app/(sfb)/              every other route, one folder per area
components/             site and app shells, shared parts; one folder per area (site, careers, hr, admin, portal, home)
components/ui/          shadcn components
lib/store.ts            mock data layer (useSyncExternalStore over localStorage)
lib/seed.ts             all demo data (bump `version` when it changes)
lib/<area>/             helpers per area
styles/                 tokens.css (DESIGN.md is the law) and the section stylesheets
public/assets/img/      logo and the company's Instagram photos; provenance in docs/SOURCES.md
tools/grand-entrance/   the scene generator
```

## Deploy

Preview deploys only, to a separate Vercel project. The live alias still serves the static site from `concept-v1`;
production is a human decision.
