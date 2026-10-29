import { AccessError, PERMISSIONS, scopeOf } from "@/lib/access";
import { audit, byId, update } from "@/lib/store";
import type { Seed, Session } from "@/lib/types";

/* How the office console runs a write. Every helper it calls checks access inside update() (assertCan), so a throw
   aborts the write. attempt() turns that throw into a message for a toast, and logs the refusal: a refused write
   leaves a line in the audit log, as a refused till check does. */

export type Attempt<T> = { ok: true; value: T } | { ok: false; message: string };

export function attempt<T>(s: Session | null, action: string, target: string, fn: () => T): Attempt<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof AccessError) {
      update((d) => audit(d, s, action, target, "Refused: needs " + PERMISSIONS[e.perm].toLowerCase(), false));
      return { ok: false, message: e.message };
    }
    if (e instanceof Error) return { ok: false, message: e.message };
    throw e;
  }
}

/** "San Fernando, Couva and Penal", or "every store". */
export function storeNames(d: Seed, ids: string[] | null) {
  if (!ids) return "every store";
  const names = ids.map((id) => byId(d.branches, id)?.name || id);
  return names.length <= 1 ? names[0] || "no store" : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

/** The sentence a scoped person sees beside anything outside their stores. */
export function scopeNote(d: Seed, s: Session | null) {
  const scope = scopeOf(d, s);
  return scope ? "Your access covers " + storeNames(d, scope) + " only." : "";
}

/** Whether a store-level thing (null = every store) sits inside the session's stores. A grant for every store
 *  covers everything; a scoped grant covers only things limited to its own stores. */
export function inScope(d: Seed, s: Session | null, ids: string[] | string | null) {
  const scope = scopeOf(d, s);
  if (!scope) return true;
  if (ids === null) return false;
  return [ids].flat().every((id) => scope.includes(id));
}

/** Throws when the thing reaches stores outside the session's grant. Call inside update(), after assertCan. */
export function assertInScope(d: Seed, s: Session | null, ids: string[] | string | null, what: string) {
  if (inScope(d, s, ids)) return;
  throw new Error(scopeNote(d, s) + " " + what + " Ask the owner's office to widen your access.");
}

/** The employee's name behind a user id, or a plain stand-in that never shows the id itself. */
export function personName(d: Seed, userId: string | null | undefined) {
  return byId(d.employees, userId)?.name || "Someone no longer on staff";
}
