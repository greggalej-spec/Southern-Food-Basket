import { ROLE_NAME, isStaff } from "@/lib/access";
import { byId } from "@/lib/store";
import type { AuditEvent, Seed } from "@/lib/types";

/* The audit log as sentences: who (name and role), what, and when. The event's detail never holds a full code, an
   e-mail address or a document (lib/store.ts audit()), so it is safe to show as it is. */

/** The area an action belongs to, from its prefix ("promo.submit" -> "promo"). The applicant's side of hiring
 *  ("careers.*") files under hiring with HR's side, so the filter shows one Hiring. */
export const areaOf = (action: string) => {
  const a = action.split(".")[0];
  return a === "careers" ? "hr" : a;
};

export const AREA_LABEL: Record<string, string> = {
  specials: "Specials",
  stores: "Stores and hours",
  notices: "Staff notices",
  site: "Website",
  promo: "Offers",
  code: "Codes",
  newsletter: "Newsletter",
  subscribers: "Mailing list",
  access: "Staff access",
  account: "Shopper accounts",
  hr: "Hiring",
  staffnews: "Staff updates",
  suppliers: "Supplier specials",
  sellout: "Sell-out reports",
  requests: "Partnerships and donations",
  feedback: "Customer feedback",
  events: "Events",
  flyers: "Flyers",
  bulk: "Bulk orders",
  tasks: "Tasks",
  resources: "Office documents",
  social: "Social accounts",
  plan: "Content calendar",
  auth: "Sign-in",
};

export const areaLabel = (area: string) => AREA_LABEL[area] || area.charAt(0).toUpperCase() + area.slice(1);

/** What the person did, as a verb phrase that reads after their name. */
const VERB: Record<string, string> = {
  "specials.add": "added a special",
  "specials.edit": "edited a special",
  "specials.remove": "removed a special",
  "stores.edit": "changed a store's hours or phone",
  "notices.post": "posted a staff notice",
  "notices.remove": "removed a staff notice",
  "site.publish": "downloaded the website data file",
  "promo.create": "drafted an offer",
  "promo.edit": "edited an offer",
  "promo.submit": "sent an offer for approval",
  "promo.approve": "approved an offer",
  "promo.reject": "sent an offer back",
  "promo.end": "ended an offer early",
  "promo.archive": "archived an offer",
  "code.claim": "claimed a members' code",
  "code.redeem": "checked a code at the till",
  "newsletter.create": "drafted a newsletter",
  "newsletter.edit": "edited a newsletter",
  "newsletter.test": "sent a test of a newsletter",
  "newsletter.schedule": "scheduled a newsletter",
  "newsletter.unschedule": "took a newsletter off the schedule",
  "newsletter.send": "sent a newsletter",
  "newsletter.signup": "signed up for the newsletter",
  "newsletter.confirm": "confirmed a newsletter sign-up",
  "newsletter.preferences": "changed what they get by e-mail",
  "newsletter.unsubscribe": "unsubscribed from the newsletter",
  "subscribers.export": "exported the mailing list with full addresses",
  "access.grant": "gave staff access",
  "access.scope": "changed which stores someone's access covers",
  "access.expiry": "changed when someone's access ends",
  "access.extra": "changed someone's till access",
  "access.revoke": "revoked staff access",
  "access.restore": "restored staff access",
  "account.link": "asked for a sign-in link",
  "account.signin": "signed in with an e-mail link",
  "account.profile": "changed their shopper profile",
  "account.delete": "deleted their shopper account",
  "staffnews.create": "drafted a staff update",
  "staffnews.edit": "edited a staff update",
  "staffnews.test": "sent a test of a staff update",
  "staffnews.schedule": "scheduled a staff update",
  "staffnews.unschedule": "took a staff update off the schedule",
  "staffnews.send": "sent a staff update",
  "staffnews.remind": "reminded staff to read an update",
  "staffnews.ack": "confirmed they read a staff update",
  "hr.decision": "sent an applicant their decision",
  "hr.decision-withdrawn": "withdrew a hiring decision",
  "careers.update-opened": "opened their hiring decision",
  "careers.offer-accepted": "accepted a job offer",
  "careers.offer-declined": "declined a job offer",
  "suppliers.book": "opened or closed a specials book",
  "suppliers.company": "added a company",
  "suppliers.import": "brought in supplier specials",
  "suppliers.edit": "changed a supplier line",
  "suppliers.add": "added a supplier line",
  "suppliers.key": "changed the key specials sheet",
  "suppliers.remove": "removed a supplier line",
  "suppliers.check": "checked a supplier sheet",
  "sellout.compile": "recorded a sell-out report",
  "sellout.send": "sent a sell-out report",
  "events.add": "added an event",
  "events.edit": "changed an event",
  "events.remove": "removed an event",
  "flyers.add": "added flyers",
  "flyers.edit": "changed a flyer",
  "flyers.remove": "deleted a flyer",
  "specials.bulk": "added specials from a list",
  "feedback.submit": "sent feedback through the website",
  "feedback.status": "moved a feedback ticket along",
  "feedback.message": "wrote on a feedback ticket",
  "feedback.assign": "gave a feedback ticket to someone",
  "requests.submit": "sent a request through the website",
  "requests.log": "logged a request",
  "requests.move": "moved a request along",
  "requests.decide": "decided a request",
  "requests.message": "wrote on a request",
  "requests.assign": "gave a request to someone",
  "bulk.open": "opened a bulk order",
  "bulk.qty": "gave a store's quantity for a bulk order",
  "bulk.order": "placed a bulk order",
  "bulk.received": "marked a bulk order received",
  "bulk.shared": "marked a bulk order shared to the stores",
  "bulk.advance": "moved a bulk order on",
  "tasks.assign": "handed out a task",
  "tasks.done": "ticked off a task",
  "tasks.reopen": "reopened a task",
  "resources.save": "saved an office document",
  "social.connect": "connected a social account",
  "social.disconnect": "disconnected a social account",
  "plan.save": "changed the content calendar",
  "plan.remove": "removed a calendar entry",
  "site.customize": "changed the website",
  "hr.person": "added or changed a staff record",
  "auth.signin": "signed in",
};

/** Details that only repeat the verb; the sentence leaves them out. */
const ECHO = new Set(["sent for approval", "drafted", "edited", "approved", "sent back", "archived", "ended early", "scheduled", "back to draft", "added a special", "edited the special", "removed the special", "removed the notice", "confirmed as read", "signed in with an e-mail link"]);

export function verbOf(action: string) {
  return VERB[action] || "did " + action.replace(/[.-]/g, " ");
}

/** "Isabel, Marketing", "A shopper", or "The newsletter schedule". */
export function actorOf(d: Seed, e: AuditEvent) {
  if (e.actor === "guest" || e.role === "guest") {
    if (e.action === "newsletter.send") return "The newsletter schedule";
    if (e.action === "staffnews.send") return "The staff updates schedule";
    return "Someone not signed in";
  }
  if (e.role === "customer") return "A shopper";
  if (e.role === "applicant") return "An applicant";
  const name = byId(d.employees, e.actor)?.name || "Someone no longer on staff";
  return isStaff(e.role) ? name + ", " + ROLE_NAME[e.role] : name;
}

/** The detail, when it adds something the sentence does not already say. */
export function detailOf(e: AuditEvent) {
  const t = (e.detail || "").trim();
  if (!t || ECHO.has(t.toLowerCase())) return "";
  return /[.!?]$/.test(t) ? t : t + ".";
}

/* "checked" -> "check", "sent" stays: only the regular past tenses the verb list uses. */
const BASE: Record<string, string> = {
  added: "add", edited: "edit", removed: "remove", changed: "change", posted: "post", downloaded: "download",
  drafted: "draft", approved: "approve", ended: "end", archived: "archive", claimed: "claim", checked: "check",
  scheduled: "schedule", confirmed: "confirm", unsubscribed: "unsubscribe", exported: "export", revoked: "revoke",
  restored: "restore", asked: "ask", deleted: "delete", opened: "open", accepted: "accept", declined: "decline",
  reminded: "remind", signed: "sign",
};
function base(word: string) {
  return BASE[word] || word;
}

/** "sent", "gave", "took" have irregular past tenses; the refused form uses these instead. */
const IRREGULAR: Record<string, string> = {
  "sent ": "send ",
  "brought ": "bring ",
  "wrote ": "write ",
  "handed ": "hand ",
  "gave ": "give ",
  "took ": "take ",
  "did ": "do ",
  "withdrew ": "withdraw ",
};
export function refusedVerb(action: string) {
  let v = verbOf(action);
  for (const [past, now] of Object.entries(IRREGULAR)) if (v.startsWith(past)) v = now + v.slice(past.length);
  return v.replace(/^(\w+)ed\b/, (m) => base(m));
}

/** The sentence after the actor's name, refused or not: "sent an offer for approval: Christmas shop." */
export function eventSentence(e: AuditEvent) {
  const what = e.ok ? verbOf(e.action) : "tried to " + refusedVerb(e.action) + " and was refused";
  return what + (e.target ? ": " + e.target : "") + ".";
}
