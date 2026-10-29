import { useEffect, useSyncExternalStore } from "react";
import { emailOk, mail, normalizeEmail } from "./newsletter";
import { audit, byId, login, logout, nowIso, session, uid, update } from "./store";
import type { Customer, Entitlement, Promotion, Seed, Session } from "./types";

/* Shopper accounts (PRD 9.2 and 9.3): needed only to take a members' code. Passwordless: the shopper types an
   e-mail address and signs in from the link sent to it (here, from the demo outbox). The account holds a name, the
   address and an optional preferred store; it never joins the mailing list by itself. */

const LINK_MS = 15 * 60 * 1000;

export type LinkResult = { ok: true; email: string } | { ok: false; field: "email" | "rate"; message: string };

const RATE_KEY = "sfb-signin-times";
const RATE_MAX = 3;
const RATE_MS = 10 * 60 * 1000;

/** Three sign-in links per browser tab in ten minutes, whatever the address, so the limit says nothing about which
 *  addresses have accounts. In production this is per IP and per address, on the server (PRD 13.2). */
function rateLimited() {
  try {
    const now = Date.now();
    const times = (JSON.parse(sessionStorage.getItem(RATE_KEY) || "[]") as number[]).filter((x) => now - x < RATE_MS);
    if (times.length >= RATE_MAX) return true;
    sessionStorage.setItem(RATE_KEY, JSON.stringify([...times, now]));
  } catch {}
  return false;
}

/** Sends a sign-in link. The reply is the same whether or not an account exists for the address. */
export function requestSignInLink(rawEmail: string, name: string, next: string | null): LinkResult {
  const email = normalizeEmail(rawEmail);
  if (!emailOk(email)) return { ok: false, field: "email", message: "Enter an e-mail address like name@example.com." };
  if (rateLimited()) {
    return { ok: false, field: "rate", message: "That is a lot of sign-in links from this browser. Use the newest one, or try again in a few minutes." };
  }
  update((d) => {
    let c = (d.customers || []).find((x) => x.email === email);
    if (!c) {
      c = { id: uid("cust"), name: name.trim().slice(0, 80), email, createdAt: nowIso(), wallet: [] };
      d.customers = [c, ...(d.customers || [])];
    }
    c.signInToken = uid("sl", 16);
    c.signInExpires = new Date(Date.now() + LINK_MS).toISOString();
    const href = "/account/verify?token=" + encodeURIComponent(c.signInToken) + (next ? "&next=" + encodeURIComponent(next) : "");
    mail(d, {
      to: email,
      kind: "transactional",
      subject: "Your sign-in link for Southern Food Basket",
      body: ["Use this link to sign in. It works once, for 15 minutes.", "If you did not ask for it, ignore this e-mail: nobody can sign in without it."],
      action: { label: "Sign in", href },
    });
    audit(d, null, "account.link", "Shopper sign-in", "Sign-in link sent");
  });
  return { ok: true, email };
}

export type VerifyResult = { ok: true; customer: Customer } | { ok: false; message: string };

/** Uses a sign-in link once. A used or expired link signs nobody in. */
export function verifySignInLink(token: string): VerifyResult {
  // Cast, not annotate: an annotated initialiser narrows `out` to the failure branch, and TypeScript cannot see the
  // assignment inside the update() callback.
  let out = { ok: false, message: "This sign-in link has been used or has expired. Ask for a new one." } as VerifyResult;
  update((d) => {
    const c = (d.customers || []).find((x) => x.signInToken && x.signInToken === token);
    if (!c || !c.signInExpires || new Date(c.signInExpires).getTime() < Date.now()) return;
    c.signInToken = undefined;
    c.signInExpires = undefined;
    c.emailVerifiedAt = c.emailVerifiedAt || nowIso();
    audit(d, { role: "customer", userId: c.id }, "account.signin", "Shopper " + c.id, "Signed in with an e-mail link");
    out = { ok: true, customer: { ...c } };
  });
  if (out.ok) login("customer", out.customer.id);
  return out;
}

/* The verify page uses its link from an effect, which React's strict mode runs twice; a second use would fail (the
   link works once) and show "used or expired" over a sign-in that worked. So each token is used once per tab and its
   result kept here, where the page reads it as an external store. */
const verified = new Map<string, VerifyResult>();
const verifyListeners = new Set<() => void>();

export function verifyOnce(token: string): VerifyResult {
  const had = verified.get(token);
  if (had) return had;
  const r = verifySignInLink(token);
  verified.set(token, r);
  verifyListeners.forEach((l) => l());
  return r;
}

function subscribeVerify(l: () => void) {
  verifyListeners.add(l);
  return () => {
    verifyListeners.delete(l);
  };
}

/** The result of verifyOnce(token), or null before it has run. */
export function useVerifyResult(token: string | null) {
  return useSyncExternalStore(subscribeVerify, () => (token ? verified.get(token) ?? null : null), () => null);
}

/** The shopper tier (lib/members.ts: accounts, wallets and claims). The public offers and sign-in pages load it on
 *  demand, for a signed-in shopper or just before a write that must see existing accounts, so the scripts every
 *  visitor downloads never carry other shoppers' addresses or codes. /account, which only a shopper reaches,
 *  imports it outright. */
export const loadShopperTier = () => import("./members");

export function useShopperTier(s: Session | null) {
  const shopper = s?.role === "customer";
  useEffect(() => {
    if (shopper) void loadShopperTier();
  }, [shopper]);
}

export function currentCustomer(d: Seed, s: Session | null) {
  return s?.role === "customer" ? byId(d.customers, s.userId) : null;
}

export type WalletItem = { code: string; entitlement: Entitlement | null; promo: Promotion | null };

/** The shopper's own codes, newest first, each with its claim and its promotion (either can be missing if the office
 *  removed it). */
export function walletFor(d: Seed, c: Customer | null): WalletItem[] {
  return (c?.wallet || []).map((w) => {
    const e = byId(d.entitlements, w.entitlementId);
    return { code: w.code, entitlement: e, promo: e ? byId(d.promotions, e.promoId) : null };
  });
}

export function saveProfile(s: Session | null, patch: { name: string; preferredBranch?: string }) {
  update((d) => {
    const c = currentCustomer(d, s);
    if (!c) return;
    c.name = patch.name.trim().slice(0, 80);
    c.preferredBranch = patch.preferredBranch || undefined;
    audit(d, s, "account.profile", "Shopper " + c.id, "Updated profile");
  });
}

/** Deletes the account: the profile goes, unused codes are cancelled, used ones stay as anonymous counts. */
export function deleteAccount(s: Session | null) {
  update((d) => {
    const c = currentCustomer(d, s);
    if (!c) return;
    (d.entitlements || []).forEach((e) => {
      if (e.customerId !== c.id) return;
      if (e.status === "claimed") e.status = "void";
      e.customerId = "deleted";
    });
    d.customers = (d.customers || []).filter((x) => x.id !== c.id);
    audit(d, s, "account.delete", "Shopper account", "Deleted by the shopper; unused codes cancelled");
  });
  logout();
}

/* Signing out of /account, or deleting it. Ending the session while the account page is mounted would wake its role
   guard, which sends the visitor to the sign-in page with ?next=/account. So the account page only navigates, and the
   sign-in page finishes the job when it mounts (finishLeaving), as the staff portal's sign-out does
   (lib/portal/login.ts). What happened stays readable (useLeftNote) so the sign-in page can say so. */
export type Leaving = "signed-out" | "deleted";
let leaving: Leaving | null = null;
let leftNote: Leaving | null = null;
const leftListeners = new Set<() => void>();

export function leaveAccount(kind: Leaving, push: (href: string) => void) {
  leaving = kind;
  push("/account/sign-in");
}

/** True between leaveAccount() and the sign-in page finishing it: the session is still there, on its way out. */
export function leavingPending() {
  return leaving !== null;
}

export function finishLeaving() {
  const k = leaving;
  if (!k) return;
  leaving = null;
  if (k === "deleted") deleteAccount(session());
  else logout();
  leftNote = k;
  leftListeners.forEach((l) => l());
}

/** Clears the "signed out" or "account deleted" note (the visitor asked for a new sign-in link). */
export function clearLeftNote() {
  if (!leftNote) return;
  leftNote = null;
  leftListeners.forEach((l) => l());
}

function subscribeLeft(l: () => void) {
  leftListeners.add(l);
  return () => {
    leftListeners.delete(l);
  };
}

/** "signed-out" or "deleted" after finishLeaving(), until clearLeftNote(). */
export function useLeftNote() {
  return useSyncExternalStore(subscribeLeft, () => leftNote, () => null);
}
