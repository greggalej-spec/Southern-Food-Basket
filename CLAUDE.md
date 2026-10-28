# Southern Food Basket — concept site (Trinovata)
What: a concept website + hiring/KYC portal + employee portal for a real south-Trinidad grocer, built
unsolicited. Not client work. Badged "Unofficial Concept" on every page. v2 uses the company's real logo,
photos and posted prices from its Instagram (third-party media, no permission: never publicise without it).
People, jobs and documents are demo data; store hours, phones and addresses come from Google Maps (see SITE.md).
Stack (branch `next-rebuild`): Next.js 16 App Router + Tailwind 4 + shadcn, no backend; demo state in localStorage via
`lib/store.ts`. Read `node_modules/next/dist/docs/` before Next APIs. Plan and port log: `docs/plan/rebuild-nextjs-shadcn.md`.
Run: `npm run dev` (port 4176 in `Dev/.claude/launch.json` as `sfb-next`). Use the `D:` path, not the `C:\Users\Gregg\Dev`
junction. Restart the dev server after CSS or `next.config.ts` edits. The home scene is generated: edit
`tools/grand-entrance/make-scene.js`, then `npm run scene`. Check: `npx tsc --noEmit -p .` and `npm run lint`.
Deploy: previews only, to a separate Vercel project; the live alias is still the static site on `concept-v1`. Never
`--prod` unattended; Gregg merges and deploys.
Rules: `DESIGN.md` (v2) and `.impeccable.md` are the design law for this site; sourced or it doesn't ship; no secrets here (there are none);
React escapes text and lint bans `dangerouslySetInnerHTML` except the generated scene; test at 375 and 910 px; contrast ≥ 4.5:1.
Facts: `SITE.md`. Registry record: `Products/Trinovata/.claude/worktrees/site-rework/build/_work.json` slug `southern-food-basket`.
