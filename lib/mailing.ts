import { MAILING_TIER } from "./seed-mailing";
import { registerTier } from "./store";

// Import this (for its effect) in any page that reads the mailing list, the consent ledger or the demo outbox: the
// newsletter confirm, preferences and unsubscribe pages and /outbox. Sign-up forms on public pages leave it out;
// their writes merge in when a page with the tier loads (lib/store.ts).
registerTier("mailing", MAILING_TIER);
