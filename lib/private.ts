import "./mailing";
import "./members";
import { MORE_GRANTS, MORE_PEOPLE, OPS_AUDIT, OPS_TIER } from "./seed-ops";
import { STAFF_TIER } from "./seed-staff";
import { STAFF_UPDATES } from "./seed-staff-updates";
import { registerTier } from "./store";

// Import this (for its effect) in every staff and applicant page; components/app-shell.tsx and the sign-in page do.
// Staff screens also need the shopper tiers (the till checks codes, marketing reads the list), so this brings all three.
// The ops part (lib/seed-ops.ts) adds the supplier specials, requests, bulk orders, tasks and marketing figures, the
// staff at every store, and their access.
registerTier("staff", {
  ...STAFF_TIER,
  ...OPS_TIER,
  staffUpdates: STAFF_UPDATES,
  employees: [...(STAFF_TIER.employees || []), ...MORE_PEOPLE],
  grants: [...(STAFF_TIER.grants || []), ...MORE_GRANTS],
  audit: [...OPS_AUDIT, ...(STAFF_TIER.audit || [])],
});
