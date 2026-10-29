import "./mailing";
import "./members";
import { STAFF_TIER } from "./seed-staff";
import { STAFF_UPDATES } from "./seed-staff-updates";
import { registerTier } from "./store";

// Import this (for its effect) in every staff and applicant page; components/app-shell.tsx and the sign-in page do.
// Staff screens also need the shopper tiers (the till checks codes, marketing reads the list), so this brings all three.
registerTier("staff", { ...STAFF_TIER, staffUpdates: STAFF_UPDATES });
