import { ROLE_NAME, STAFF_ROLES, assertCan, grantLive, type StaffRole } from "@/lib/access";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { Grant, Seed, Session } from "@/lib/types";
import { personName, storeNames } from "./guard";
import { dayTT } from "./tt";

/* The owner's office's writes on staff access (PRD 4.1, 12.1 ADM-010, 13.2). Each one checks access.manage inside
   update() and writes one audit line. The lockout guard: nobody changes or revokes their own owner's office grant,
   and the last live owner's office grant cannot be revoked, limited or time-limited, so the shop can never be left
   with nobody able to give access. A revoked or expired grant signs nobody in from their next click, in every
   open tab (sessionValid in lib/access.ts). */

export const SOON_DAYS = 30;

export type GrantState = "live" | "soon" | "expired" | "revoked";

export const GRANT_STATE: Record<GrantState, { label: string; tone: "ok" | "warn" | "bad" | "plain" }> = {
  live: { label: "Live", tone: "ok" },
  soon: { label: "Ends soon", tone: "warn" },
  expired: { label: "Expired", tone: "plain" },
  revoked: { label: "Revoked", tone: "bad" },
};

export function grantState(g: Grant, now: number): GrantState {
  if (g.revokedAt) return "revoked";
  if (g.expires && new Date(g.expires).getTime() <= now) return "expired";
  if (g.expires && new Date(g.expires).getTime() - now < SOON_DAYS * 86400000) return "soon";
  return "live";
}

/** "Store admin for Princes Town until 15 Nov 2026". */
export function grantLine(d: Seed, g: Pick<Grant, "role" | "branchIds" | "expires">) {
  const stores = g.branchIds ? storeNames(d, g.branchIds) : "every store";
  return ROLE_NAME[g.role] + " for " + stores + (g.expires ? " until " + dayTT(g.expires) : ", no end date");
}

function liveOwners(d: Seed, except?: string) {
  return (d.grants || []).filter((g) => g.role === "owner" && g.id !== except && grantLive(g));
}

/** Why the session may not make this kind of change to this grant, or null. The screens show it instead of the
 *  control; the writes throw it. */
export function lockoutBlock(d: Seed, s: Session | null, g: Grant, change: "revoke" | "limit") {
  if (g.role !== "owner") return null;
  if (g.userId === s?.userId) return "This is your own owner's office access. Another owner has to change it, so nobody locks themselves out.";
  if (change === "revoke" && grantLive(g) && !liveOwners(d, g.id).length) return "This is the only live owner's office access. Give someone else owner's office access first.";
  if (change === "limit" && !liveOwners(d, g.id).length) return "This is the only live owner's office access, so it keeps every store and no end date.";
  return null;
}

function find(d: Seed, s: Session | null, id: string) {
  assertCan(d, s, "access.manage");
  const g = byId(d.grants, id);
  if (!g) throw new Error("That access is no longer on record. Reload the page.");
  return g;
}

function guard(d: Seed, s: Session | null, g: Grant, change: "revoke" | "limit") {
  const block = lockoutBlock(d, s, g, change);
  if (block) throw new Error(block);
}

function checkStores(d: Seed, branchIds: string[] | null) {
  if (branchIds === null) return null;
  const ids = Array.from(new Set(branchIds)).filter((id) => byId(d.branches, id));
  if (!ids.length) throw new Error("Choose at least one store, or every store.");
  return ids;
}

export function setGrantStores(s: Session | null, id: string, branchIds: string[] | null) {
  update((d) => {
    const g = find(d, s, id);
    const ids = checkStores(d, branchIds);
    if (ids) guard(d, s, g, "limit");
    if (JSON.stringify(g.branchIds) === JSON.stringify(ids)) return;
    g.branchIds = ids;
    audit(d, s, "access.scope", personName(d, g.userId), ROLE_NAME[g.role] + " now covers " + storeNames(d, ids));
  });
}

/** expires: an instant (the end of a Trinidad day), or null for no end date. */
export function setGrantExpiry(s: Session | null, id: string, expires: string | null) {
  update((d) => {
    const g = find(d, s, id);
    if (expires) {
      guard(d, s, g, "limit");
      if (new Date(expires).getTime() <= Date.now()) throw new Error("Choose an end date after today, or clear it.");
    }
    if ((g.expires || null) === expires) return;
    if (expires) g.expires = expires;
    else delete g.expires;
    audit(d, s, "access.expiry", personName(d, g.userId), ROLE_NAME[g.role] + (expires ? " now ends " + dayTT(expires) : " now has no end date"));
  });
}

/** Till access: codes.redeem on top of an employee grant. */
export function setTillAccess(s: Session | null, id: string, on: boolean) {
  update((d) => {
    const g = find(d, s, id);
    if (g.role !== "employee") throw new Error("Till access goes on an employee grant.");
    const extra = (g.extra || []).filter((p) => p !== "codes.redeem");
    if (on) extra.push("codes.redeem");
    if (on === (g.extra || []).includes("codes.redeem")) return;
    if (extra.length) g.extra = extra;
    else delete g.extra;
    audit(d, s, "access.extra", personName(d, g.userId), on ? "Can now record shoppers' codes at the till" : "Can no longer record codes at the till");
  });
}

export function revokeGrant(s: Session | null, id: string, reason: string) {
  const why = reason.trim().replace(/\s+/g, " ");
  update((d) => {
    const g = find(d, s, id);
    if (!why) throw new Error("Give a reason for revoking. It goes in the audit log.");
    if (g.revokedAt) return;
    guard(d, s, g, "revoke");
    g.revokedAt = nowIso();
    g.revokedBy = s!.userId!;
    audit(d, s, "access.revoke", personName(d, g.userId), ROLE_NAME[g.role] + " revoked. Reason: " + why.slice(0, 200));
  });
}

export function restoreGrant(s: Session | null, id: string) {
  update((d) => {
    const g = find(d, s, id);
    if (!g.revokedAt) return;
    const twin = (d.grants || []).find((x) => x.id !== g.id && x.userId === g.userId && x.role === g.role && grantLive(x));
    if (twin) throw new Error(personName(d, g.userId) + " already holds live " + ROLE_NAME[g.role] + " access. Change that one instead.");
    delete g.revokedAt;
    delete g.revokedBy;
    const expired = !!g.expires && new Date(g.expires).getTime() <= Date.now();
    audit(d, s, "access.restore", personName(d, g.userId), ROLE_NAME[g.role] + " restored" + (expired ? "; its end date has passed, so it signs nobody in until it is extended" : ""));
  });
}

export type NewGrant = { userId: string; role: StaffRole; branchIds: string[] | null; expires: string | null; till: boolean };

export function addGrant(s: Session | null, input: NewGrant) {
  let id = "";
  update((d) => {
    assertCan(d, s, "access.manage");
    const who = byId(d.employees, input.userId);
    if (!who) throw new Error("Choose a member of staff.");
    if (!STAFF_ROLES.includes(input.role)) throw new Error("Choose a role.");
    const ids = checkStores(d, input.branchIds);
    if (input.expires && new Date(input.expires).getTime() <= Date.now()) throw new Error("Choose an end date after today, or leave it empty.");
    if ((d.grants || []).some((g) => g.userId === who.id && g.role === input.role && grantLive(g))) {
      throw new Error(who.name + " already holds live " + ROLE_NAME[input.role] + " access. Change that one instead.");
    }
    const g: Grant = { id: uid("g"), userId: who.id, role: input.role, branchIds: ids, grantedBy: s!.userId!, grantedAt: nowIso() };
    if (input.expires) g.expires = input.expires;
    if (input.till && input.role === "employee") g.extra = ["codes.redeem"];
    d.grants = [...(d.grants || []), g];
    id = g.id;
    audit(d, s, "access.grant", who.name, grantLine(d, g) + (g.extra ? ", with till access" : ""));
  });
  return id;
}
