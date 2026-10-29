import { MEMBERS_TIER } from "./seed-members";
import { registerTier } from "./store";

// Import this (for its effect) in any page that reads shoppers' accounts or codes: the shopper's account and the
// offer pages (whether an offer is full, whether you already hold its code). It carries no mailing-list addresses;
// those are lib/mailing.ts.
registerTier("members", MEMBERS_TIER);
