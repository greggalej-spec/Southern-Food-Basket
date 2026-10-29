import { logout, safeNext } from "../store";
import type { Role } from "../types";

// The demo sign-in's routing, from portal.js. Each role lands on its own home; a ?next= is honoured only when
// safeNext() accepts it and it sits inside the role's area, so an applicant's next cannot open /hr. The area check is
// by path segment on the parsed path: /careers and /careers/… are the applicant's, /careersx is not.

export const ROLE_HOME: Record<Role, string> = {
  customer: "/account",
  applicant: "/careers/me",
  employee: "/portal/home",
  hr: "/hr",
  admin: "/admin",
  marketing: "/admin",
  owner: "/admin",
};

const ROLE_AREA: Record<Role, string[]> = {
  customer: ["/account", "/offers"],
  applicant: ["/careers"],
  employee: ["/portal"],
  hr: ["/portal", "/hr"],
  admin: ["/admin", "/portal"],
  marketing: ["/admin", "/portal"],
  owner: ["/admin", "/portal"],
};

const ROLES = Object.keys(ROLE_HOME) as Role[];

/** The role a query value names, or null (never a key inherited from Object). */
export function roleParam(v: string | null | undefined): Role | null {
  return ROLES.find((r) => r === v) ?? null;
}

export function inArea(role: Role, path: string) {
  const p = path.split(/[?#]/)[0];
  return ROLE_AREA[role].some((a) => p === a || p.startsWith(a + "/"));
}

/** Where signing in as `role` goes: the safe ?next= when it is in the role's area, else the role's home. */
export function destinationFor(role: Role, next: string | null | undefined) {
  const n = safeNext(next);
  return n && inArea(role, n) ? n : ROLE_HOME[role];
}

/** One parameter of the current query string (SFBUI.qs). Browser only: call it after hydration. */
export function queryParam(name: string) {
  return new URLSearchParams(location.search).get(name);
}

/* Sign out from a portal page. portal.js logged out and loaded the sign-in page with no ?next=. Logging out while the
   portal page is still mounted would wake its role guard, which sends the visitor to /portal?next=<that page>. So the
   portal page only navigates, and the sign-in page ends the session when it mounts (finishSignOut), hiding the
   "signed in as" note until then. */
let signingOut = false;

export function signOutTo(push: (href: string) => void) {
  signingOut = true;
  push("/portal");
}

export function signOutPending() {
  return signingOut;
}

export function finishSignOut() {
  if (!signingOut) return;
  signingOut = false;
  logout();
}
