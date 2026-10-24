# Southern Food Basket — concept site (Trinovata)
What: a concept website + hiring/KYC portal + employee portal for a real south-Trinidad grocer, built
unsolicited. Not client work. Badged "Unofficial Concept" on every page. v2 uses the company's real logo,
photos and posted prices from its Instagram (third-party media, no permission: never publicise without it).
People, jobs and documents are demo data; store hours, phones and addresses come from Google Maps (see SITE.md).
Run: static, no build. `python -m http.server 4175` from this folder, open http://localhost:4175/. Home page is generated: `node tools/grand-entrance/build.js`. Layout and the social-feed API: SITE.md.
Deploy: Vercel (static). Never `--prod` unattended. Work on branch `concept-v1`; Gregg merges to main.
Rules: `DESIGN.md` (v2) and `.impeccable.md` are the design law for this site; sourced or it doesn't ship; no secrets here (there are none);
every user string goes through `SFBUI.esc()` or `textContent`; test at 375 and 910 px; contrast ≥ 4.5:1.
Facts: `SITE.md`. Registry record: `Products/Trinovata/.claude/worktrees/site-rework/build/_work.json` slug `southern-food-basket`.
