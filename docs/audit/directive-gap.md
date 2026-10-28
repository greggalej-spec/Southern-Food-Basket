# The pasted "UI/UX Inspiration & Development Library" directive, against what is built

Source: a ChatGPT-written directive Gregg pasted on 2026-10-28 (7 reference sites, 15 React repos, a 6-phase plan,
8 deliverables). This note records what it asks for, what the site already does, and what needs Gregg's decision.
Nothing in it was installed.

## Verdict

Most of the directive is already done in the static build, by hand. Its central recommendation, rebuilding on
Next.js + shadcn/ui with React Bits, Motion Primitives, Kokonut UI or Magic UI, is a stack change that would replace
the approved zero-dependency build. **Blocked: decision needed** (section 4).

## 1. The 15 repos

Every component library on the list is React, and most need Tailwind, so none drop into this plain HTML/CSS/JS site
without a build step. All 15 exist: each licence below was read with `gh api repos/<name>` (`.license.spdx_id`) on
2026-10-28. "NOASSERTION" means GitHub could not classify the licence; react-bits' LICENSE.md was read, the two
Vercel repos' were not. Notes on tiers and keys come from the research subagent, 2026-10-28.

| Repo | Licence | Note | Usable here as-is |
|---|---|---|---|
| shadcn-ui/ui | MIT | Copy-in components; needs React + Tailwind | No |
| DavidHDev/react-bits | MIT + Commons Clause (LICENSE.md) | Commons Clause forbids selling the components themselves; porting one into a client deliverable needs care | No |
| magicuidesign/magicui | MIT | React + Tailwind + Motion | No |
| ibelick/motion-primitives | MIT | React + Motion | No |
| kokonut-labs/kokonutui | MIT | Has a paid Pro tier | No |
| educlopez/smoothui | MIT | React | No |
| cosscom/ui | AGPL-3.0 | Copyleft: using it would oblige releasing the site's source | No: avoid |
| shadcnspace/shadcnspace | MIT | shadcn block collection | No |
| Mun1to/Vibeset | MIT | 4 stars on 2026-10-28 | No |
| 21st-dev/magic-mcp | ISC | AI tool, needs an API key | Not a site dependency |
| vercel/ai-elements | NOASSERTION (not read) | README line 4: "will be deprecated at the end of November 2026" | No |
| LocalMode-AI/LocalMode | MIT | On-device AI | Out of scope |
| birobirobiro/awesome-shadcn-ui | MIT | A list, not a library | n/a |
| vercel/ai-chatbot | NOASSERTION (not read) | Renamed to vercel/chatbot | Out of scope |
| magicuidesign/mcp | MIT | AI tool for Magic UI | Not a site dependency |

## 2. The 7 reference sites

danilodemarco.com, niccolomiranda.com, bleibtgleich.dev, 2xa.studio, thibaut.cool, bulbs.simondupety.com,
ollivere.webflow.io. None showed WebGL, GSAP or Lenis in the fetched content (research subagent; not re-checked).
Webflow is inferred for three, Prismic for bulbs. What transfers is technique, not code, and it is already in
`assets/js/living.js`, hand-written: cloth-physics flags, a jointed waving crew, palms and birds, bunting you can
grab, swinging price seals, word-mask reveals and scroll-tied drift. Static under reduced motion.

## 3. The six phases and eight deliverables

| Directive asks for | Here | Evidence |
|---|---|---|
| Audit of the current site | Done | `docs/audit/*.md` |
| Three homepage directions | Done, four: Grand Entrance (main) plus A, B, C, with a chooser and a side-by-side toggle | `options/index.html`, `assets/options-nav/` |
| Design system | Done | `DESIGN.md`, `.impeccable.md`, `assets/css/tokens.css` |
| Responsive pages | Done | Swept at 320, 375, 390, 768, 910, 1024, 1280, 1440, 1920: no overflow, no dock collisions |
| Animation | Done, no libraries | `assets/js/living.js`, `assets/js/grand-entrance.js` |
| Performance and accessibility reports | Partial | Contrast and reduced motion checked by hand; no Lighthouse report recorded |
| Before/after | Not produced | Git history holds every stage (`git log`) |
| Deploy and rollback plan | Partial | Deploy: `vercel deploy --prod` from this folder (SITE.md). Rollback: `vercel rollback` or redeploy an earlier commit |

Rules in the directive the build already keeps: no dependencies at all; licences checked; no invented products,
prices, stores or claims (SITE.md lists every source); no checkout; nothing to production without Gregg's word.

## 4. Blocked: decision needed

1. **Stack.** Keep the static, zero-dependency site, or migrate to Next.js + shadcn/ui. Migration buys the
   component ecosystem; it costs a rebuild of every page and the portals, a build step and dependency upkeep, and it
   departs from the approved "no libraries" motion direction. Gregg decides.
2. **Tagline "Fresh finds. Southern roots."** Written by ChatGPT, not the company's. Use only if the owners adopt it.
3. **An AI assistant or chatbot** (ai-elements, chatbot, LocalMode). Not in the PRD. ai-elements is deprecated at
   the end of November 2026.
4. **Stock photography.** Not usable. The hero now says the site is a prototype and that final visuals and drone
   footage come when the project begins; the shot list (`docs/shotlist.md`) is the plan for them.
5. **Keyed or paid tools** (magic-mcp API key, Kokonut Pro). Not needed for the static build.
