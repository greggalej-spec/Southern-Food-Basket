import { assertCan, can } from "./access";
import { assertInScope, inScope, scopeNote } from "./admin/guard";
import { audit, byId, load, nowIso, uid, update } from "./store";
import type { Entitlement, Promotion, RedeemAttempt, Seed, Session } from "./types";

/* Promotions and their codes (PRD 9.1 and 9.5). Display-and-claim mode: a signed-in shopper claims a code, shows it
   at the till, and the cashier keys it in to record it. There is no POS link, so no copy may say a code redeems by
   itself. Every rule is checked here, not in the screens:
   - codes are 8 characters from an alphabet with no look-alikes (no 0/O, 1/I/L, 2/Z, 5/S, 8/B), drawn from
     crypto.getRandomValues: 25^8, about 1.5 × 10^11, so guessing is hopeless and the lockout makes it slower still;
   - only the code's SHA-256 is kept on the claim; staff screens see the last four characters;
   - a till check re-reads the claim inside one update(), so a code cannot be recorded twice;
   - five refused checks in ten minutes lock that cashier's till checks for five minutes;
   - a person whose access covers some stores only drafts, approves, ends and archives offers for those stores only. */

export const CODE_ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";
const CODE_LEN = 8;
export const TT_ZONE = "America/Port_of_Spain"; // UTC-4 all year: Trinidad keeps no daylight saving

/** "k7qm 4xdp" → "K7QM4XDP". Anything that is not a letter or a digit is dropped. */
export function normalizeCode(v: string) {
  return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isCodeShape(norm: string) {
  return norm.length === CODE_LEN && [...norm].every((c) => CODE_ALPHABET.includes(c));
}

/** K7QM4XDP → K7QM-4XDP */
export function formatCode(norm: string) {
  return norm.slice(0, 4) + "-" + norm.slice(4);
}

export function newCode() {
  const b = new Uint32Array(CODE_LEN);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join("");
}

export async function hashCode(norm: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0")).join("");
}

/* states */

export type PromoState = "draft" | "review" | "rejected" | "archived" | "scheduled" | "live" | "full" | "ended";

export const PROMO_STATE: Record<PromoState, { label: string; tone: "info" | "warn" | "ok" | "bad" | "plain" }> = {
  draft: { label: "Draft", tone: "plain" },
  review: { label: "Waiting for approval", tone: "warn" },
  rejected: { label: "Sent back", tone: "bad" },
  archived: { label: "Archived", tone: "plain" },
  scheduled: { label: "Scheduled", tone: "info" },
  live: { label: "Live", tone: "ok" },
  full: { label: "All codes claimed", tone: "warn" },
  ended: { label: "Ended", tone: "plain" },
};

const t = (iso: string) => new Date(iso).getTime();

export function claimsFor(d: Seed, promoId: string) {
  return (d.entitlements || []).filter((e) => e.promoId === promoId && e.status !== "void");
}

export function promoState(d: Seed, p: Promotion, now = new Date()): PromoState {
  if (p.status !== "approved") return p.status;
  const n = now.getTime();
  if (n < t(p.starts)) return "scheduled";
  // `ends` is the moment it stops: an offer ended "now" is ended at once, not a millisecond later
  if (n >= t(p.ends)) return "ended";
  if (p.limits.total !== null && claimsFor(d, p.id).length >= p.limits.total) return "full";
  return "live";
}

/** What the public site may show: approved promotions that have started. Drafts, promotions in review and scheduled
 *  ones never reach a public page, whatever the browser holds. */
export function publicPromos(d: Seed, now = new Date()) {
  return (d.promotions || []).filter((p) => ["live", "full", "ended"].includes(promoState(d, p, now)));
}

export function livePromos(d: Seed, now = new Date()) {
  return (d.promotions || []).filter((p) => promoState(d, p, now) === "live");
}

export function promoBySlug(d: Seed, slug: string, now = new Date()) {
  return publicPromos(d, now).find((p) => p.slug === slug) || null;
}

export function storesLabel(d: Seed, branchIds: string[] | null) {
  if (!branchIds) return "All five stores";
  const names = branchIds.map((id) => byId(d.branches, id)?.name || id);
  return names.length === 1 ? names[0] + " only" : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

export function fmtTT(iso: string, withTime = false) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TT_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
  });
}

/* shopper side */

export type ClaimResult =
  | { ok: true; code: string; entitlement: Entitlement }
  | { ok: false; reason: "signed-out" | "unverified" | "not-live" | "already" | "full"; message: string };

/** Claims a code for the signed-in shopper. The plain code goes only into the shopper's own wallet. */
export async function claimCode(s: Session | null, promoId: string): Promise<ClaimResult> {
  const d0 = load();
  const me = s?.role === "customer" ? byId(d0.customers, s.userId) : null;
  if (!me) return { ok: false, reason: "signed-out", message: "Sign in to take a code." };
  if (!me.emailVerifiedAt) return { ok: false, reason: "unverified", message: "Confirm your e-mail address first: the link is in your inbox." };
  let norm = newCode();
  let hash = await hashCode(norm);
  while ((d0.entitlements || []).some((e) => e.codeHash === hash)) {
    norm = newCode();
    hash = await hashCode(norm);
  }
  let out: ClaimResult = { ok: false, reason: "not-live", message: "This offer is not running." };
  update((d) => {
    const p = byId(d.promotions, promoId);
    const state = p ? promoState(d, p) : "ended";
    if (!p || state !== "live") {
      out = state === "full" ? { ok: false, reason: "full", message: "Every code for this offer has been claimed." } : { ok: false, reason: "not-live", message: "This offer is not running." };
      return;
    }
    const mine = claimsFor(d, p.id).filter((e) => e.customerId === me.id);
    if (mine.length >= p.limits.perCustomer) {
      out = { ok: false, reason: "already", message: "You already have a code for this offer. It is in My offers." };
      return;
    }
    const e: Entitlement = { id: uid("ent"), promoId: p.id, customerId: me.id, codeHash: hash, last4: norm.slice(4), claimedAt: nowIso(), status: "claimed" };
    d.entitlements = [e, ...(d.entitlements || [])];
    const c = byId(d.customers, me.id);
    if (c) c.wallet = [{ entitlementId: e.id, code: formatCode(norm) }, ...(c.wallet || [])];
    d.outbox = [
      {
        id: uid("ob"),
        at: nowIso(),
        to: me.email,
        kind: "transactional",
        subject: "Your code: " + p.benefit,
        body: [
          "Your code is waiting in your account, under My offers. It is not in this e-mail, so a forwarded e-mail cannot be used by someone else.",
          "Show it at the till before you pay; the cashier checks it and records it. " + storesLabel(d, p.branchIds) + ", until " + fmtTT(p.ends) + ".",
        ],
        action: { label: "Open My offers", href: "/account" },
      },
      ...(d.outbox || []),
    ];
    audit(d, s, "code.claim", p.title, "Claimed a code ending " + e.last4);
    out = { ok: true, code: formatCode(norm), entitlement: e };
  });
  return out;
}

/* till side */

export type RedeemReason = "recorded" | "no-access" | "locked" | "format" | "unknown" | "not-started" | "ended" | "wrong-store" | "used" | "void";

export interface RedeemResult {
  ok: boolean;
  reason: RedeemReason;
  message: string;
  promo?: Promotion;
  last4?: string;
  lockedUntil?: string;
}

const WINDOW_MS = 10 * 60 * 1000;
const LOCK_MS = 5 * 60 * 1000;
const MAX_FAILS = 5;

/** When this cashier's till checks are locked, the time they unlock (ISO); otherwise null. */
export function lockedUntil(d: Seed, staffId: string, now = Date.now()): string | null {
  const fails = (d.redemptions || []).filter((r) => r.by === staffId && !r.ok && now - t(r.at) < WINDOW_MS && r.reason !== "Locked");
  if (fails.length < MAX_FAILS) return null;
  const until = t(fails[0].at) + LOCK_MS; // redemptions are newest first
  return until > now ? new Date(until).toISOString() : null;
}

/** A cashier checks a code at their store's till and, if it passes, it is recorded as used. */
export async function redeemCode(s: Session | null, branchId: string, raw: string): Promise<RedeemResult> {
  const d0 = load();
  if (!can(d0, s, "codes.redeem", { branchId })) {
    return { ok: false, reason: "no-access", message: "You cannot record codes at this store. Ask the owner's office for till access." };
  }
  const staffId = s!.userId!;
  const norm = normalizeCode(raw);
  const hash = isCodeShape(norm) ? await hashCode(norm) : "";
  let out: RedeemResult = { ok: false, reason: "unknown", message: "" };
  update((d) => {
    assertCan(d, s, "codes.redeem", { branchId });
    const until = lockedUntil(d, staffId);
    const log = (ok: boolean, reason: string, e?: Entitlement) => {
      const r: RedeemAttempt = { id: uid("rd"), at: nowIso(), by: staffId, branchId, ok, reason, last4: norm.slice(-4) || "—", entitlementId: e?.id };
      d.redemptions = [r, ...(d.redemptions || [])].slice(0, 500);
      audit(d, s, "code.redeem", "Code ending " + r.last4, ok ? "Recorded at " + (byId(d.branches, branchId)?.name || branchId) : "Refused: " + reason.toLowerCase(), ok);
    };
    if (until) {
      out = { ok: false, reason: "locked", lockedUntil: until, message: "Too many codes did not match. Code checks at this till unlock at " + fmtTT(until, true).split(", ").pop() + "." };
      return;
    }
    if (!hash) {
      log(false, "Not a code");
      out = { ok: false, reason: "format", message: "That is not a code. Codes are 8 letters and numbers, like HXQ3-7MRA." };
      return;
    }
    const e = (d.entitlements || []).find((x) => x.codeHash === hash);
    const p = e ? byId(d.promotions, e.promoId) : null;
    if (!e || !p) {
      log(false, "No match");
      out = { ok: false, reason: "unknown", last4: norm.slice(4), message: "No code matches. Check each character with the shopper." };
      return;
    }
    const base = { promo: p, last4: e.last4 };
    if (e.status === "void") {
      log(false, "Cancelled", e);
      out = { ok: false, reason: "void", ...base, message: "This code was cancelled." };
      return;
    }
    if (e.status === "redeemed") {
      log(false, "Already used", e);
      out = { ok: false, reason: "used", ...base, message: "Already used on " + fmtTT(e.redeemedAt || "", true) + " at " + (byId(d.branches, e.redeemedBranch || "")?.name || "another store") + "." };
      return;
    }
    if (Date.now() < t(p.starts)) {
      log(false, "Not started", e);
      out = { ok: false, reason: "not-started", ...base, message: "This offer starts on " + fmtTT(p.starts) + "." };
      return;
    }
    if (Date.now() >= t(p.ends) || p.status !== "approved") {
      log(false, "Ended", e);
      out = { ok: false, reason: "ended", ...base, message: "This offer ended on " + fmtTT(p.ends) + "." };
      return;
    }
    if (p.branchIds && !p.branchIds.includes(branchId)) {
      log(false, "Wrong store", e);
      out = { ok: false, reason: "wrong-store", ...base, message: "This code is for " + storesLabel(d, p.branchIds) + ". It cannot be used here." };
      return;
    }
    e.status = "redeemed";
    e.redeemedAt = nowIso();
    e.redeemedBy = staffId;
    e.redeemedBranch = branchId;
    log(true, "Recorded", e);
    out = { ok: true, reason: "recorded", ...base, message: "Recorded. Take " + p.benefit.replace(/^TT\$/, "TT$") + " off this shop." };
  });
  return out;
}

/* staff side: the promotion workflow. Author and approver must be different people (PRD 12.2). */

export type PromoDraft = Omit<Promotion, "id" | "status" | "createdBy" | "createdAt" | "revisions" | "submittedAt" | "approvedBy" | "approvedAt" | "reviewNote">;

function slugify(v: string) {
  return String(v).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "offer";
}

/** Saves a draft (new when id is null). Editing a promotion that was approved sends it back to draft. */
export function savePromo(s: Session | null, id: string | null, draft: PromoDraft) {
  let savedId = "";
  update((d) => {
    assertCan(d, s, "promos.draft");
    const cur = id ? byId(d.promotions, id) : null;
    if (cur) assertInScope(d, s, cur.branchIds, "This offer runs at other stores too.");
    assertInScope(d, s, draft.branchIds, "An offer at other stores is outside it.");
    if (cur) {
      const wasApproved = cur.status === "approved";
      Object.assign(cur, draft, { status: "draft", reviewNote: undefined });
      cur.revisions = [...cur.revisions, { at: nowIso(), by: s!.userId!, summary: wasApproved ? "Edited after approval: back to draft" : "Edited" }];
      audit(d, s, "promo.edit", cur.title, wasApproved ? "Edited an approved promotion; it needs approval again" : "Edited");
      savedId = cur.id;
    } else {
      let slug = slugify(draft.slug || draft.title);
      while ((d.promotions || []).some((p) => p.slug === slug)) slug += "-2";
      const p: Promotion = { ...draft, slug, id: uid("promo"), status: "draft", createdBy: s!.userId!, createdAt: nowIso(), revisions: [{ at: nowIso(), by: s!.userId!, summary: "Drafted" }] };
      d.promotions = [p, ...(d.promotions || [])];
      audit(d, s, "promo.create", p.title, "Drafted");
      savedId = p.id;
    }
  });
  return savedId;
}

export function submitPromo(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "promos.draft");
    const p = byId(d.promotions, id);
    if (!p || !["draft", "rejected"].includes(p.status)) return;
    assertInScope(d, s, p.branchIds, "This offer runs at other stores too.");
    p.status = "review";
    p.submittedAt = nowIso();
    p.revisions.push({ at: nowIso(), by: s!.userId!, summary: "Sent for approval" });
    audit(d, s, "promo.submit", p.title, "Sent for approval");
  });
}

/** Why this person may not approve this promotion, or null when they may. */
export function approveBlock(d: Seed, s: Session | null, p: Promotion) {
  if (!can(d, s, "promos.approve")) return "Only the owner's office approves promotions.";
  if (p.createdBy === s?.userId) return "You drafted this one. Someone else has to approve it.";
  if (p.status !== "review") return "Only promotions waiting for approval can be approved.";
  if (!inScope(d, s, p.branchIds)) return scopeNote(d, s) + " This offer runs at other stores too, so someone with every store approves it.";
  return null;
}

export function decidePromo(s: Session | null, id: string, approve: boolean, note: string) {
  update((d) => {
    const p = byId(d.promotions, id);
    if (!p) return;
    const block = approveBlock(d, s, p);
    if (block) throw new Error(block);
    p.status = approve ? "approved" : "rejected";
    p.reviewNote = note || undefined;
    if (approve) {
      p.approvedBy = s!.userId!;
      p.approvedAt = nowIso();
    }
    p.revisions.push({ at: nowIso(), by: s!.userId!, summary: approve ? "Approved" : "Sent back" + (note ? ": " + note : "") });
    audit(d, s, approve ? "promo.approve" : "promo.reject", p.title, approve ? "Approved" : "Sent back");
  });
}

/** Ends a running promotion now (owner's office). Claimed codes stop working at the till. One that has not started
 *  yet is archived instead: ending it would leave an end date before its start. */
export function endPromo(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "promos.approve");
    const p = byId(d.promotions, id);
    if (!p) throw new Error("That offer no longer exists.");
    const state = promoState(d, p);
    if (state === "scheduled") throw new Error("This offer has not started yet. Archive it to take it off the schedule.");
    if (state !== "live" && state !== "full") throw new Error("Only a running offer can be ended. This one is " + PROMO_STATE[state].label.toLowerCase() + ".");
    assertInScope(d, s, p.branchIds, "This offer runs at other stores too.");
    p.ends = nowIso();
    p.revisions.push({ at: nowIso(), by: s!.userId!, summary: "Ended early" });
    audit(d, s, "promo.end", p.title, "Ended early");
  });
}

/** Archives a promotion. Drafts, ones sent back and ended ones are the drafter's to tidy away; an approved one that
 *  has not ended comes off the site, so only the owner's office may archive it, and a live one is ended first. */
export function archivePromo(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "promos.draft");
    const p = byId(d.promotions, id);
    if (!p) throw new Error("That offer no longer exists.");
    const state = promoState(d, p);
    if (state === "archived") return;
    if (state === "live") throw new Error("This offer is live. End it first; then it can be archived.");
    if (state === "review") throw new Error("This offer is waiting for approval. Ask the owner's office to send it back first.");
    if (state === "scheduled" || state === "full") assertCan(d, s, "promos.approve");
    assertInScope(d, s, p.branchIds, "This offer runs at other stores too.");
    p.status = "archived";
    p.revisions.push({ at: nowIso(), by: s!.userId!, summary: "Archived" });
    audit(d, s, "promo.archive", p.title, "Archived");
  });
}

/** Counts for the codes screen. No shopper identity: claims are counted, not listed by person. */
export function promoStats(d: Seed, p: Promotion) {
  const claims = claimsFor(d, p.id);
  const used = claims.filter((e) => e.status === "redeemed");
  const byBranch: Record<string, number> = {};
  used.forEach((e) => (byBranch[e.redeemedBranch || "?"] = (byBranch[e.redeemedBranch || "?"] || 0) + 1));
  return { claimed: claims.length, redeemed: used.length, left: p.limits.total === null ? null : Math.max(0, p.limits.total - claims.length), byBranch };
}
