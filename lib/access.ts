import type { Grant, Role, Seed, Session } from "./types";

/* Who may do what. Every staff write goes through can() or assertCan(): hiding a menu item is not access control
   (PRD 4.1). A staff session counts only while its grant is live, so revoking a grant ends that person's access on
   their next action, in every open tab.

   This is a browser-only demo, so a determined visitor can still edit localStorage. In production the same matrix
   becomes server-side checks (row-level security on every table), and these helpers only shape the screens. */

export const PERMISSIONS = {
  "portal.self": "See your own shifts, leave, pay and profile",
  "specials.edit": "Add, edit and remove specials",
  "posts.make": "Make Instagram posts from specials",
  "stores.edit": "Change store hours and phone numbers",
  "notices.post": "Post staff notices",
  "staff.updates": "Write and send staff e-mail updates, for the stores in your access",
  "site.publish": "Download the website data file",
  "promos.draft": "Draft promotions and send them for approval",
  "promos.approve": "Approve, schedule, pause and end promotions",
  "codes.view": "See claims and redemptions (codes masked)",
  "codes.redeem": "Record a shopper's code at the till",
  "newsletter.view": "See the mailing list (addresses masked) and campaigns",
  "newsletter.compose": "Write newsletters and send tests",
  "newsletter.send": "Schedule and send newsletters",
  "subscribers.export": "See full addresses and export the list",
  "hr.pipeline": "Review applications and their documents",
  "hr.jobs": "Open and close jobs",
  "hr.compliance": "Staff documents, training and leave",
  "hr.people": "See the staff list for every store, and add or update people",
  "access.manage": "Give, limit and revoke staff access",
  "audit.view": "Read the audit log",
  "suppliers.view": "See supplier specials and the key specials sheet",
  "suppliers.edit": "Bring in supplier sheets, enter case prices and mark them checked",
  "sellout.log": "Record and send sell-out reports",
  "requests.log": "Log partnership, promotion and donation requests, reply to them and follow them up",
  "requests.decide": "Approve or decline partnership, promotion and donation requests",
  "feedback.handle": "Read customer feedback, reply to it and mark it resolved",
  "events.manage": "Put events, promotions and flyers on the public site",
  "bulk.manage": "Set up bulk orders and place them",
  "bulk.store": "Give your store's quantity for a bulk order",
  "tasks.assign": "Hand out tasks and see everyone's",
  "resources.edit": "Add and change office templates and guides",
  "analytics.view": "See the marketing figures",
  "social.connect": "Connect and disconnect social accounts",
  "plan.edit": "Plan posts on the content calendar",
  "site.customize": "Change the website's season, notice bar and home page",
  "overview.view": "See the owner's overview of every department",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type StaffRole = Grant["role"];

/** The role matrix. Least privilege: marketing never sees applicants, HR never sees the mailing list, and even the
 *  owner's role does not open HR files without an HR grant. */
export const ROLE_PERMS: Record<Role, Permission[]> = {
  customer: [],
  applicant: [],
  employee: ["portal.self"],
  hr: ["portal.self", "hr.pipeline", "hr.jobs", "hr.compliance", "hr.people", "staff.updates"],
  admin: [
    "portal.self", "specials.edit", "posts.make", "stores.edit", "notices.post", "staff.updates", "site.publish", "codes.view",
    "suppliers.view", "suppliers.edit", "sellout.log", "requests.log", "bulk.manage", "bulk.store", "tasks.assign", "resources.edit",
    "feedback.handle", "events.manage",
  ],
  // Purchasing checks the supplier specials and can correct them. Nothing else in the office is theirs.
  purchasing: ["portal.self", "suppliers.view", "suppliers.edit", "bulk.store"],
  marketing: [
    "portal.self", "posts.make", "promos.draft", "codes.view", "newsletter.view", "newsletter.compose", "newsletter.send",
    "analytics.view", "social.connect", "plan.edit", "site.customize", "suppliers.view", "events.manage", "specials.edit",
  ],
  owner: [
    "suppliers.view", "suppliers.edit", "sellout.log", "requests.log", "requests.decide", "bulk.manage", "bulk.store", "tasks.assign",
    "resources.edit", "analytics.view", "social.connect", "plan.edit", "site.customize", "overview.view", "feedback.handle", "events.manage",
    "portal.self",
    "specials.edit",
    "posts.make",
    "stores.edit",
    "notices.post",
    "staff.updates",
    "site.publish",
    "promos.draft",
    "promos.approve",
    "codes.view",
    "newsletter.view",
    "newsletter.compose",
    "newsletter.send",
    "subscribers.export",
    "access.manage",
    "audit.view",
  ],
};

export const STAFF_ROLES: StaffRole[] = ["employee", "hr", "admin", "purchasing", "marketing", "owner"];

export const ROLE_NAME: Record<Role, string> = {
  customer: "Shopper",
  applicant: "Applicant",
  employee: "Employee",
  hr: "HR",
  admin: "Administration",
  purchasing: "Purchasing",
  marketing: "Marketing",
  owner: "Owner's office",
};

export const isStaff = (r: Role | null | undefined): r is StaffRole => !!r && (STAFF_ROLES as Role[]).includes(r);

// The clock is read only once a session is in hand: the server prerenders these screens with no session, and
// Next.js refuses a `new Date()` read during prerender.
export function grantLive(g: Grant, now?: Date) {
  return !g.revokedAt && (!g.expires || new Date(g.expires).getTime() > (now || new Date()).getTime());
}

/** The live grant behind a staff session, or null (revoked, expired, or never given). */
export function activeGrant(d: Seed, s: Pick<Session, "role" | "userId"> | null, now?: Date): Grant | null {
  if (!s || !isStaff(s.role)) return null;
  const at = now || new Date();
  return (d.grants || []).find((g) => g.userId === s.userId && g.role === s.role && grantLive(g, at)) || null;
}

/** Whether a session may use a role at all: self-service roles always, staff roles only with a live grant. */
export function sessionValid(d: Seed, s: Session | null, now?: Date) {
  if (!s) return false;
  if (s.role === "customer") return !!(d.customers || []).find((c) => c.id === s.userId);
  if (s.role === "applicant") return !!(d.applicants || []).find((a) => a.id === s.userId);
  return !!activeGrant(d, s, now);
}

/** can(d, session, "codes.redeem", { branchId: "sando" }): the grant is live, the role or the grant's extra
 *  permissions allow it, and, when the action is about one store, that store is inside the grant's scope. */
export function can(d: Seed, s: Session | null, perm: Permission, opts: { branchId?: string | null } = {}) {
  if (!s || !isStaff(s.role)) return false;
  const g = activeGrant(d, s);
  if (!g) return false;
  if (!ROLE_PERMS[s.role].includes(perm) && !(g.extra || []).includes(perm)) return false;
  if (opts.branchId && g.branchIds && !g.branchIds.includes(opts.branchId)) return false;
  return true;
}

/** The stores a session's grant covers: null means all of them. */
export function scopeOf(d: Seed, s: Session | null): string[] | null {
  return activeGrant(d, s)?.branchIds ?? null;
}

export class AccessError extends Error {
  constructor(public perm: Permission) {
    super("You do not have access to this. Ask the owner's office: " + PERMISSIONS[perm].toLowerCase() + ".");
    this.name = "AccessError";
  }
}

/** Throws AccessError when the session may not do it. Call at the top of every staff write. */
export function assertCan(d: Seed, s: Session | null, perm: Permission, opts: { branchId?: string | null } = {}) {
  if (!can(d, s, perm, opts)) throw new AccessError(perm);
}

/** r•••@example.com. Staff without subscribers.export see every address like this. */
export function maskEmail(email: string) {
  const [user, domain] = String(email).split("@");
  if (!domain) return "•••";
  return (user ? user[0] : "") + "•••@" + domain;
}
