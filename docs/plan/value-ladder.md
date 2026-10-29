# Southern Food Basket: value ladder and pricing brief

*Internal to Trinovata, 2026-10-29. Gregg asked overnight to "see how we can optimize this site for a price bracket well above its current value". This is not a quote. Nothing goes to the business until rate card §2 is run and a client record exists. **All prices are TTD.***

**Labels.**
- **[C]**: computed on 29 Oct by `quote.mjs` `buildQuote()` from `menu.mjs` (20 USD/h at cost, FX 8, list price 3.0×, floor 2.5×).
- **[E]**: a judgement estimate.
- **[R]**: a recorded fact.

The hour inputs in `menu.mjs` are judgement too, and no pricing ledger exists yet (`~/.trinovata/pricing-ledger.jsonl` is absent, checked 29 Oct). So every [C] figure is exact arithmetic on uncalibrated inputs.

**Sources.** `menu.mjs`, `quote.mjs` and the ACTIVE `rate-card.md` (written "rate card (wt)" below) are in `D:\Dev\Products\Trinovata-Docs\.claude\worktrees\pricing\finance\`, on the unmerged branch `worktree-pricing` (86adb77). `master` still has the older PARTIAL rate card. "Plan" means `docs/plan/rebuild-nextjs-shadcn.md`; "PRD" means `docs/prd/SFB-PRD-001.md`. The scratch scripts that produced the figures were not kept in the repo.

**One calculator caveat.** `buildPhasedQuote()` uses one quantity map for every phase, so items that repeat across phases (such as `integration-custom`) all land in the first phase that asks for them. Its own output put phase 2 at 68,736. Each later phase below is priced separately instead, using the function's own rule (no foundation, 4 h re-mobilisation). Fix the function before using it for a real quote.

## 1. Where the build sits

| Reference point | TTD | Source |
|---|---|---|
| What a T&T or Caribbean grocer normally pays for a brochure site | **not recorded** | No file holds a market figure. Plan §8 says "No market anchor yet". |
| Trinovata's only real website sale: Juniper House, files only / full service | 3,000 / 5,000 [R] | `Trinovata-Docs\finance\rate-card.md` §1 |
| House-model brochure site (contact form, search setup) | 13,920 list [C] | rate card (wt) §1 |
| This build as a mock with no backend (Option A port, 80–122 h) | 38,400–58,560 list [C on E hours] | Plan §6; `tools/rebuild-cost.mjs`, re-run 29 Oct |
| Promotions, members' codes, newsletter, access and audit (added 29 Oct) | priced in rungs 3–4 below | §2 |
| Booked revenue | 0 | No SFB folder in `Dev\Clients\` |

Even unbilled, the mock is already worth about 3–4× the house brochure list price, and 8–12× Juniper's full-service price. The rate card's own test says anything with logins, dashboards or compliance work "is a different product" (`finance\rate-card.md` §1a). By that test this is not a website. It is an operations platform that has been shown as a website.

## 2. The value ladder

Each rung includes everything in the rungs below it.
- Prices are [C], given as normal client / "involved" client. The involved factor (×1.2) is internal and never shown to the client; plan §8 argues it fits.
- The menu has no item for a document vault, e-mail and consent engine, promo-code engine, employee portal or access console. Each one is priced as `integration-custom` (14 h, 6,720 list), the same convention as `tools/rebuild-cost.mjs:36-37`. That mapping is [E].

| | 1. Shopfront | 2. + Careers & HR | 3. + Marketing engine | 4. Operations platform |
|---|---|---|---|---|
| **What's in it** | Grand Entrance home, specials, departments, wholesale enquiry, 5 store pages with maps, about, local SEO, accessibility pass | Careers board, 5-step application with KYC checklist, applicant dashboard with sealed decision updates, HR pipeline, document verify/flag, jobs, compliance | Promotions studio (author ≠ approver), post maker, store hours, members' codes (hashed, till redemption, lockout, store scope), passwordless shopper accounts, newsletter (double opt-in, consent ledger, segments, scheduling, test sends), masked list with audited export | Employee portal (rota, swaps, leave, payslips, training), per-store access grants with expiry and revoke, audit log |
| **Must become real** | Licensed media or a photo shoot (subcontracted, so unpriced: `menu.mjs:118-120`); store facts verified by the owners; paid hosting (Vercel's free Hobby plan is non-commercial, plan §7); enquiry form that actually delivers | Server-side roles; Postgres with RLS; private KYC storage with signed links, retention and deletion; transactional e-mail; privacy notice; counsel on the Data Protection Act | E-mail provider, sending domain, bounce and complaint suppression; server-side code checks inside transactions; rate limits; a manual till procedure, since there is no POS link (PRD 9.5 then bans "redeems instantly" copy) | An authoritative payroll and scheduling source (PRD 10.1); staff MFA (PRD ADM-010); security review |
| Hours | 81 / 97 | 158 / 190 | 211 / 253 | 243 / 291 |
| **List** | **39,192 / 46,958** | **76,248 / 91,426** | **101,400 / 121,608** | **116,760 / 140,040** |
| Floor (2.5×) | 32,660 | 63,540 | 84,500 | 97,300 |
| Care [C] | Essential 1,152/mo (Standard 2,280/mo if Trinovata posts the weekly specials) | Standard 2,280/mo | Standard 2,280/mo | Priority 4,920/mo |
| 36-month term, care and the 15% finance uplift included [C] | 2,404/mo | 4,716/mo | 5,519/mo | 8,650/mo (311,394 contract) |

**Recurring costs.** Care prices include the menu's 20 USD/month hosting. Database, storage, e-mail provider and paid Vercel costs are **not recorded**; plan §7 says to price them at signup. By default the client pays them directly (rate card (wt) §4d).

**Add-ons [C rate, E scope].**
- Each POS or payroll integration: +6,720 list (+8,064 involved), quoted after discovery.
- Security review and privacy drafting have no menu item. Plan B6 + B7 put them at 9–15 h, which is +4,320–7,200 at 480/h (`houseRates()`).

**Phasing [C].** Delivering rungs 1→4 in four phases totals 122,520, against 116,760 in one engagement: a 4.9% premium.

**Against the business plan.** At the code's FX of 8, rungs 2–4 clear the business plan's 7,500 USD floor for its lowest tier (rate card (wt) §1). Rung 1 does not.

## 3. What moves it up a bracket, in the buyer's terms

These are formulas, not ROI figures. The owners supply the inputs.

| Feature (where it exists) | Buyer's gain | Formula | Client supplies |
|---|---|---|---|
| Application + KYC checklist + HR pipeline (`components/careers/`, `components/hr/`) | Cheaper, faster hiring | HR hours saved per month = applications/mo × (minutes per paper application − minutes in pipeline) ÷ 60, × HR wage. Plus vacancy days saved × daily cost of cover. | Applications/mo, current minutes, HR wage, days to fill a post |
| Applicant dashboard with sealed updates | Fewer status calls | Calls/mo × minutes per call × wage | Calls/mo |
| Members' codes recorded at the till per store (`lib/promo.ts`) | Promotions you can measure | Redemption rate = redeemed ÷ claimed (the system counts both). Net = redemptions × (avg basket × margin % − discount) | Avg basket, margin %, discount |
| Newsletter + consent ledger + store segments (`lib/newsletter.ts`) | Owning the customer list | Value per send = confirmed subscribers × open rate × click rate × visit rate × avg basket × margin %. They hold the list and its consent evidence; on Instagram they hold neither. | Visit rate (pair it with a code), basket, margin |
| Specials editor, store hours, post maker (`components/admin/`) | Marketing admin hours | Posts/week × (minutes now − minutes with the maker) × 52 ÷ 60 × wage | Posts/week, minutes, wage |
| Employee portal (`components/portal/`) | Staff admin hours | (Leave + swap requests + payslip queries)/mo × minutes each × admin wage | Volumes and wage; also needs a real payroll source |
| Author ≠ approver, grants with expiry, audit log (`lib/access.ts`) | Control over wrong prices and ex-staff logins | Risk, not revenue: incidents/yr × cost per incident | Price-error incidents, staff turnover |

## 4. Productisation

| Module | Generic now? | SFB-specific parts to lift out |
|---|---|---|
| Access model (`lib/access.ts`: permissions, `Grant.branchIds`, expiry, revoke) | Yes | Role names |
| Promo codes (`lib/promo.ts`) | Mostly | `TT_ZONE` is hard-coded to Port of Spain; the copy |
| Newsletter and consent (`lib/newsletter.ts`) | Mostly | The `CONSENT` text and the topics name SFB |
| Hiring and KYC portal (careers + HR) | Mostly | The KYC list comes from general T&T knowledge (`SITE.md:44`), so it becomes a per-employer setting |
| Grand Entrance, departments, price seals | No | This is the theme layer |

A multi-tenant version needs:
- a `tenant_id` and tenant + branch RLS on every table;
- per-tenant settings: brand tokens, consent wording and version, KYC list, timezone;
- per-tenant sending domains and suppression lists;
- separate KYC storage per tenant, each with its own retention rules;
- onboarding and billing;
- a data-processing agreement per tenant. `agreements\data-processing-agreement.md` is written for TradeLynq today, so it would be instantiated, not forked.

Not costed: no menu item covers multi-tenancy.

**SaaS fee [E].** Per tenant per month = (support hours × 20 USD + infrastructure share) × 8 × 3. With the Standard care inputs (3 h + 15 USD) that is 1,800/mo before infrastructure.

**Keeping resale rights.** Extract these modules as **Trinovata Background IP** before anything is signed with SFB. The Website Development Agreement (`agreements\website-development-agreement.md`) assigns the client only the bespoke elements (cl. 9.2) and keeps generic modules with Trinovata (cl. 9.3). Plan §1 notes that a resellable template "is not recorded as a goal anywhere". That is Gregg's call.

## 5. Risks and prerequisites

- **No permission for the media.** The traced logo, 29 Instagram photos and the typed prices have no licence or approval on record (`docs/audit/asset-inventory.md:17-19,27`; `docs/audit/risk-register.md` R-12). Contact the business before anything else. The public alias exists only so it can be shared with them (`SITE.md:12`).
- **Where the PRD's decisions came from.** PRD §2.1 cites a "Website design feedback session" transcript and marks DEC-001–017 "Confirmed", but the repo holds no client approval, and SITE.md calls the build unsolicited. Establish who that session was with before presenting any of those decisions as the owners'.
- **Mock vs real.** Today:
  - sign-in is a role string in the browser;
  - data lives in localStorage, which `lib/access.ts` admits a visitor can edit;
  - uploads keep only metadata;
  - e-mail goes to a demo outbox;
  - there is no POS link;
  - payroll and rota data are invented (`docs/audit/integrations.md:17,21,24,25`).
- **Honest effort to production [E].** 150–226 h for the scope as it stood before 29 Oct (plan §7), and 243–291 h for rung 4 by the menu. Neither is calibrated.
- **Data protection.** The application collects government ID, BIR and NIS numbers, a Certificate of Character and bank details (plan §7). The Data Protection Act, 2011 is only partly proclaimed (`legal\compliance-checklist.md:26`), and counsel item C1 is still open (`info\open-items.md:45`). Every document in the legal suite is a DRAFT that needs attorney review.
- **PRD items still unbuilt** (code grep, 29 Oct):
  - events and news publishing (ADM-006);
  - a media library with rights metadata (ADM-009);
  - a promotional calendar (ADM-002);
  - per-store pages (there is one `/locations` page today);
  - an interactive map (DEC-011);
  - analytics (§20; there is no tag at all);
  - birthday offers, phone and SMS opt-in (§9.3–9.4);
  - POS-validated redemption (§9.5);
  - loyalty-provider discovery (EP-17);
  - staff MFA;
  - malware scanning of uploads (§13.2);
  - automated bounce handling;
  - HR reporting (§11.1);
  - a separate operations domain (DEC-017).

## 6. Next steps, in order

1. Review the 29 Oct work on `next-rebuild` (preview deploys only, no `--prod`).
2. Merge `worktree-pricing` into Trinovata-Docs `master`, or record that branch as canonical, so any quote cites merged code.
3. Find out who the PRD's feedback session was with, and record it in `SITE.md`.
4. Contact the owners, gently, given the recent bereavement. Lead with careers (PRD DEC-005). Ask for:
   - permission to use their media;
   - who the decision-maker is (PRD Q2);
   - whether the KYC document list is right;
   - which POS, payroll and e-mail systems they use (Q7, Q8, Q10, Q13).
5. If they're interested:
   - run `new-client`;
   - log the quote with `ledger.mjs`;
   - generate the SOW and Schedule B with `docs.mjs`;
   - choose the contract classification. Standard / Portfolio-Permitted needs their consent to show the work, and the price reflects the rights chosen (cl. 4.5).

   Offer rungs 1–2 first and phase in 3–4.
6. Before quoting rung 2 or higher: get counsel on C1 and on how long to keep KYC documents, instantiate the data-processing agreement, and price the database, storage and e-mail providers.
