// Costs the Next.js + shadcn rebuild (docs/plan/rebuild-nextjs-shadcn.md) two ways:
// bottom-up phase hours, and Trinovata's house menu via buildQuote(). Rates come from menu.mjs, never from here.
// Run: node tools/rebuild-cost.mjs   (set SFB_FINANCE to the finance folder if it moves)
import { pathToFileURL } from "node:url";
const F = (process.env.SFB_FINANCE || "D:/Dev/Products/Trinovata-Docs/.claude/worktrees/pricing/finance").replace(/\/?$/, "/");
const { RATES, CLIENT_FACTOR } = await import(pathToFileURL(F + "menu.mjs").href);
const { buildQuote } = await import(pathToFileURL(F + "quote.mjs").href);

/* [phase, low hours, high hours]: judgement, not measured (no pricing ledger yet) */
const A = [
  ["A0 Baseline + setup", 3, 5], ["A1 Tokens into Tailwind + shadcn", 4, 6], ["A2 Shells + data layer", 6, 10],
  ["A3 Public pages x5", 8, 12], ["A4 Grand Entrance home + living layer", 10, 16], ["A5 Careers + KYC apply", 10, 14],
  ["A6 HR console", 8, 12], ["A7 Store admin", 10, 14], ["A8 Employee portal x7", 8, 12],
  ["A9 Options A-C as static files", 1, 3], ["A10 QA + parity", 10, 14], ["A11 Preview deploy + redirects", 2, 4],
];
const B = [
  ["B1 Accounts + roles", 12, 16], ["B2 Database + RLS", 14, 20], ["B3 KYC document vault", 14, 22],
  ["B4 Admin publishes for real", 8, 12], ["B5 Notifications", 4, 6], ["B6 Security review", 6, 10],
  ["B7 Privacy + consent drafts", 3, 5], ["B8 Real content load + training", 6, 10], ["B9 Local SEO", 4, 6],
];
const sum = (rows, i) => rows.reduce((s, r) => s + r[i], 0);
const { hourlyCostUsd: h, fx, listMult, floorMult } = RATES;
const ttd = (hrs, mult, cf = 1) => Math.round(hrs * cf * h * mult * fx).toLocaleString("en-US");
const row = (label, lo, hi, cf = 1) => console.log(`${label}: ${lo}-${hi} h x client ${cf}` +
  ` | cost TTD ${ttd(lo, 1, cf)}-${ttd(hi, 1, cf)} | floor TTD ${ttd(lo, floorMult, cf)}-${ttd(hi, floorMult, cf)}` +
  ` | list TTD ${ttd(lo, listMult, cf)}-${ttd(hi, listMult, cf)}`);

console.log("RATES", JSON.stringify(RATES));
const aLo = sum(A, 1), aHi = sum(A, 2), bLo = sum(B, 1), bHi = sum(B, 2);
row("Option A, port the concept", aLo, aHi);
/* production drops A9 (the options pages are a pitch device) and adds B */
const pLo = aLo - A[9][1] + bLo, pHi = aHi - A[9][2] + bHi;
row("Option B, production, normal client", pLo, pHi);
row("Option B, production, involved client", pLo, pHi, CLIENT_FACTOR.involved.mult);

/* house-menu cross-check for the production scope; the menu has no "employee portal" or "document vault"
   item, so those ride on integration-custom x2 */
const ids = ["page-extra", "form-contact", "form-intake", "search-filter", "auth-basic", "dashboard", "cms-full",
  "integration-custom", "motion-heavy", "seo-local", "legal-pages", "accessibility", "integration-maps",
  "integration-analytics", "integration-hosting", "integration-domain", "training", "migration"];
for (const client of ["normal", "involved"]) {
  const q = buildQuote(ids, { qty: { "page-extra": 3, "integration-custom": 2 }, client });
  console.log(`House menu, ${client}: ${q.hours.toFixed(0)} h | floor TTD ${Math.round(q.floorTtd).toLocaleString("en-US")}` +
    ` | list TTD ${Math.round(q.listTtd).toLocaleString("en-US")} | external ${q.monthlyExternalUsd} USD/month + ${q.annualExternalUsd} USD/year`);
}
