import { assertCan } from "@/lib/access";
import { fmtDate } from "@/lib/format";
import { SEED } from "@/lib/seed";
import { MAILING_TIER } from "@/lib/seed-mailing";
import { MEMBERS_TIER } from "@/lib/seed-members";
import { STAFF_TIER } from "@/lib/seed-staff";
import { audit, update } from "@/lib/store";
import type { Promotion, Seed, Session } from "@/lib/types";
import { todayIso } from "./helpers";

/* The data file the Publish section hands to the web team. It replaces lib/seed.ts, which every visitor's browser
   downloads, so it carries public data only:
   - every private collection is written empty, as lib/seed.ts writes them: the ones named here, and any other list
     the shipped public seed keeps empty (so a collection added later stays out by default);
   - promotions are the approved ones only, without the reviewer's note, the revision history or who drafted them. */

const PRIVATE = [
  "applicants",
  "employees",
  "announcements",
  "policies",
  "grants",
  "customers",
  "entitlements",
  "redemptions",
  "subscribers",
  "consents",
  "campaigns",
  "outbox",
  "audit",
] as const;

/** Keys that never leave the database: the list above, plus whatever the public seed ships as an empty list. */
export function privateKeys() {
  const seed = SEED as unknown as Record<string, unknown>;
  const empty = Object.keys(seed).filter((k) => Array.isArray(seed[k]) && (seed[k] as unknown[]).length === 0);
  return Array.from(new Set<string>([...PRIVATE, ...empty]));
}

/** Approved promotions, stripped to what a shopper may see. */
export function publicPromotions(list: Promotion[]): Promotion[] {
  return list
    .filter((p) => p.status === "approved")
    .map((p) => {
      const out: Promotion = { ...p, createdBy: "", revisions: [] };
      delete out.reviewNote;
      delete out.approvedBy;
      return out;
    });
}

function fileText(d: Seed, version: number) {
  const out = JSON.parse(JSON.stringify(d)) as Record<string, unknown>;
  delete out._tiers;
  privateKeys().forEach((k) => (out[k] = []));
  out.promotions = publicPromotions(d.promotions || []);
  out.version = version;
  const header =
    'import type { Seed } from "./types";\n\n' +
    "/* Southern Food Basket — seed data for the concept site.\n" +
    "   Exported from the office console on " + fmtDate(todayIso()) + " (version " + version + ").\n" +
    "   Two kinds of data, kept apart:\n" +
    "   - SOURCED: deals, prices, post dates, department lines and the Couva location come from the company's own\n" +
    "     public Instagram posts; company facts and branch addresses come from public directories (unverified).\n" +
    "   - DEMO: every person, job, document, hour, phone number and e-mail is invented for the prototype.\n" +
    "   Public data only. Staff and shopper data live in the database in production, so applicants, employees,\n" +
    "   notices, policies, access grants, shoppers, codes, till checks, the mailing list, consents, newsletters, the\n" +
    "   outbox and the audit log are written empty here. Promotions are the approved ones, with the reviewer's note,\n" +
    "   the revision history and the author left out.\n" +
    "   This export keeps the data only. The notes on where each item came from live in the original lib/seed.ts.\n" +
    "   Bump `version` when the seed changes so stale localStorage copies are replaced. */\n";
  return header + "export const SEED: Seed = " + JSON.stringify(out, null, 2) + ";\n";
}

/** Builds the file and logs the download. Throws AccessError without site.publish. */
export function exportSeed(s: Session | null) {
  let text = "";
  let version = 0;
  update((d) => {
    assertCan(d, s, "site.publish");
    version = (Number(d.version) || 0) + 1;
    text = fileText(d, version);
    audit(d, s, "site.publish", "Website data file", "Downloaded version " + version + " (public data only)");
  });
  return { text, version };
}

type Rows = { id: string }[];

/** What the browser started with: the public seed plus the three private tiers, merged the way lib/store.ts does
 *  (lib/private.ts registers mailing, then members, then staff). Used to say what changed in this browser. */
export function shippedData(): Record<string, unknown> {
  const out = JSON.parse(JSON.stringify(SEED)) as Record<string, unknown>;
  [MAILING_TIER, MEMBERS_TIER, STAFF_TIER].forEach((tier) => {
    for (const [k, rows] of Object.entries(tier)) {
      const have = (out[k] as Rows | undefined) || [];
      const ids = new Set(have.map((r) => r.id));
      out[k] = [...have, ...JSON.parse(JSON.stringify(rows as Rows)).filter((r: { id: string }) => !ids.has(r.id))];
    }
  });
  return out;
}
