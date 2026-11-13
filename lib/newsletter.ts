import { assertCan } from "./access";
import { audit, byId, differs, load, nowIso, uid, update } from "./store";
import type { Campaign, ConsentEvent, OutboxMessage, Seed, Session, Subscriber } from "./types";

/* The weekly e-mail (PRD 6.4 and 9.4). No account needed. Double opt-in: a sign-up is "pending" until the person
   clicks the link in the confirmation e-mail. Every change writes to the consent ledger. Nothing is sent: messages
   go to the demo outbox (/outbox).

   Two privacy rules the screens rely on:
   - a sign-up never says whether the address was already on the list (the reply is the same either way), so the
     form cannot be used to check who subscribes;
   - job applications and shopper accounts never add anyone to the list. Only this form, with its box ticked, does. */

export const CONSENT = {
  version: "nl-2026-10",
  text: "E-mail me Southern Food Basket’s weekly specials, events and promotions, about once a week. Every e-mail has an unsubscribe link.",
} as const;

export const TOPICS = [
  { id: "weekly-specials", label: "This week’s specials" },
  { id: "offers", label: "Events and promotions" },
  { id: "store-news", label: "Store news and events" },
] as const;

export const SUB_STATE: Record<Subscriber["status"], { label: string; tone: "info" | "warn" | "ok" | "bad" | "plain" }> = {
  pending: { label: "Not confirmed yet", tone: "warn" },
  active: { label: "Subscribed", tone: "ok" },
  unsubscribed: { label: "Unsubscribed", tone: "plain" },
  suppressed: { label: "Suppressed", tone: "bad" },
};

export function normalizeEmail(v: string) {
  return String(v || "").trim().toLowerCase();
}

export function emailOk(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(v)) && v.length <= 254;
}

function consent(d: Seed, subscriberId: string, action: ConsentEvent["action"], source: string) {
  d.consents = [{ id: uid("cn"), subscriberId, action, wording: CONSENT.version, source, at: nowIso() }, ...(d.consents || [])];
}

export function mail(d: Seed, m: Omit<OutboxMessage, "id" | "at">) {
  d.outbox = [{ id: uid("ob"), at: nowIso(), ...m }, ...(d.outbox || [])];
}

const RATE_KEY = "sfb-signup-times";
const RATE_MAX = 3;
const RATE_MS = 10 * 60 * 1000;

/** Three sign-ups per browser tab in ten minutes. In production this is per IP and per address, on the server. */
function rateLimited() {
  try {
    const now = Date.now();
    const times = (JSON.parse(sessionStorage.getItem(RATE_KEY) || "[]") as number[]).filter((x) => now - x < RATE_MS);
    if (times.length >= RATE_MAX) return true;
    sessionStorage.setItem(RATE_KEY, JSON.stringify([...times, now]));
  } catch {}
  return false;
}

export type SignupResult = { ok: true } | { ok: false; field: "email" | "consent" | "rate"; message: string };

/** The public sign-up. Answers the same way whether or not the address was already on the list. */
export function subscribe(input: { email: string; branches: string[]; topics: string[]; consent: boolean; source: string }): SignupResult {
  const email = normalizeEmail(input.email);
  if (!emailOk(email)) return { ok: false, field: "email", message: "Enter an e-mail address like name@example.com." };
  if (!input.consent) return { ok: false, field: "consent", message: "Tick the box to agree to the e-mails, or leave this for now." };
  if (rateLimited()) return { ok: false, field: "rate", message: "That is a lot of sign-ups from this browser. Try again in a few minutes." };
  const topics = input.topics.length ? input.topics : TOPICS.map((x) => x.id);
  update((d) => {
    let s = (d.subscribers || []).find((x) => x.email === email);
    if (s?.status === "suppressed" || s?.status === "active") {
      audit(d, null, "newsletter.signup", "Sign-up form (" + input.source + ")", s.status === "active" ? "Already subscribed: no change" : "Suppressed address: no e-mail sent");
      return;
    }
    if (!s) {
      s = { id: uid("sub"), email, status: "pending", branches: input.branches, topics, source: input.source, createdAt: nowIso(), token: uid("tk", 12) };
      d.subscribers = [s, ...(d.subscribers || [])];
    } else {
      Object.assign(s, { status: "pending", branches: input.branches, topics, source: input.source, token: uid("tk", 12), unsubscribedAt: undefined });
    }
    consent(d, s.id, "requested", input.source);
    mail(d, {
      to: email,
      kind: "transactional",
      subject: "Confirm your weekly specials e-mail",
      body: [
        "Someone, we hope you, asked for the Southern Food Basket weekly specials at this address.",
        "Confirm and we will send about one e-mail a week. If it was not you, ignore this and nothing more arrives.",
      ],
      action: { label: "Yes, send me the specials", href: "/newsletter/confirm?token=" + encodeURIComponent(s.token) },
    });
    audit(d, null, "newsletter.signup", "Sign-up form (" + input.source + ")", "Confirmation e-mail sent");
  });
  return { ok: true };
}

export function subscriberByToken(d: Seed, token: string | null) {
  return token ? (d.subscribers || []).find((x) => x.token === token) || null : null;
}

export function confirmSubscription(token: string) {
  let out: Subscriber | null = null;
  update((d) => {
    const s = subscriberByToken(d, token);
    // Only a pending address confirms. An old link must not sign an unsubscribed or suppressed address back up:
    // signing up again sends a new link.
    if (!s || s.status === "suppressed" || s.status === "unsubscribed") return;
    if (s.status === "pending") {
      s.status = "active";
      s.confirmedAt = nowIso();
      consent(d, s.id, "confirmed", "Confirmation link");
      audit(d, null, "newsletter.confirm", "Subscriber " + s.id, "Confirmed by e-mail link");
    }
    out = { ...s };
  });
  return out as Subscriber | null;
}

export function updatePreferences(token: string, branches: string[], topics: string[]) {
  update((d) => {
    const s = subscriberByToken(d, token);
    if (!s) return;
    Object.assign(s, { branches, topics });
    consent(d, s.id, "updated", "Preferences page");
    audit(d, null, "newsletter.preferences", "Subscriber " + s.id, "Changed stores or topics");
  });
}

/** One click, no sign-in, no "are you sure". A suppressed address (it bounced, or someone complained) stays
 *  suppressed: that is the stronger block. */
export function unsubscribe(token: string) {
  update((d) => {
    const s = subscriberByToken(d, token);
    if (!s || s.status === "unsubscribed" || s.status === "suppressed") return;
    s.status = "unsubscribed";
    s.unsubscribedAt = nowIso();
    consent(d, s.id, "withdrawn", "Unsubscribe link");
    audit(d, null, "newsletter.unsubscribe", "Subscriber " + s.id, "Unsubscribed by e-mail link");
  });
}

/* staff side */

/** Who a campaign would reach: confirmed subscribers only, matched on stores and topics. Pending, unsubscribed and
 *  suppressed addresses are never counted. */
export function audience(d: Seed, segment: Campaign["segment"]) {
  return (d.subscribers || []).filter(
    (s) =>
      s.status === "active" &&
      (!segment.branches || !s.branches.length || s.branches.some((b) => segment.branches!.includes(b))) &&
      (!segment.topics.length || s.topics.some((x) => segment.topics.includes(x))),
  );
}

export type CampaignDraft = Pick<Campaign, "subject" | "preheader" | "template" | "intro" | "specialIds" | "promoId" | "segment">;

export function saveCampaign(s: Session | null, id: string | null, draft: CampaignDraft) {
  let savedId = "";
  update((d) => {
    assertCan(d, s, "newsletter.compose");
    const cur = id ? byId(d.campaigns, id) : null;
    if (cur) {
      if (cur.status === "sent") throw new Error("A sent newsletter cannot be changed.");
      const changed = differs(cur, draft);
      Object.assign(cur, draft);
      savedId = cur.id;
      if (changed) audit(d, s, "newsletter.edit", cur.subject, "Edited");
    } else {
      const c: Campaign = { ...draft, id: uid("cmp"), status: "draft", createdBy: s!.userId!, createdAt: nowIso(), testSends: [] };
      d.campaigns = [c, ...(d.campaigns || [])];
      savedId = c.id;
      audit(d, s, "newsletter.create", c.subject, "Drafted");
    }
  });
  return savedId;
}

/** A test goes only to the signed-in staff member's own work address. */
export function sendTest(s: Session | null, id: string) {
  let to = "";
  update((d) => {
    assertCan(d, s, "newsletter.compose");
    const c = byId(d.campaigns, id);
    const me = byId(d.employees, s?.userId);
    if (!c || !me) return;
    to = me.email;
    c.testSends = [{ at: nowIso(), to }, ...c.testSends];
    mail(d, { to, kind: "marketing", subject: "[Test] " + c.subject, body: [c.preheader, c.intro].filter(Boolean), campaignId: c.id });
    audit(d, s, "newsletter.test", c.subject, "Test sent to own work address");
  });
  return to;
}

export function scheduleCampaign(s: Session | null, id: string, at: string | null) {
  update((d) => {
    assertCan(d, s, "newsletter.send");
    const c = byId(d.campaigns, id);
    if (!c || c.status === "sent") return;
    c.status = at ? "scheduled" : "draft";
    c.scheduledFor = at || undefined;
    audit(d, s, at ? "newsletter.schedule" : "newsletter.unschedule", c.subject, at ? "Scheduled" : "Back to draft");
  });
}

function deliver(d: Seed, c: Campaign) {
  const list = audience(d, c.segment);
  list.forEach((sub) =>
    mail(d, {
      to: sub.email,
      kind: "marketing",
      subject: c.subject,
      body: [c.preheader, c.intro].filter(Boolean),
      campaignId: c.id,
      action: { label: "Change what you get, or unsubscribe", href: "/newsletter/preferences?token=" + encodeURIComponent(sub.token) },
    }),
  );
  c.status = "sent";
  c.sentAt = nowIso();
  c.sentTo = list.length;
  return list.length;
}

export function sendNow(s: Session | null, id: string) {
  let n = 0;
  update((d) => {
    assertCan(d, s, "newsletter.send");
    const c = byId(d.campaigns, id);
    if (!c || c.status === "sent") return;
    n = deliver(d, c);
    audit(d, s, "newsletter.send", c.subject, "Sent to " + n + " subscriber" + (n === 1 ? "" : "s"));
  });
  return n;
}

/** Sends scheduled campaigns whose time has come. The newsletter screen calls it when it opens; in production a
 *  scheduled job does. */
export function sendDue(now = Date.now()) {
  const due = (load().campaigns || []).filter((c) => c.status === "scheduled" && c.scheduledFor && new Date(c.scheduledFor).getTime() <= now);
  if (!due.length) return 0;
  update((d) => {
    due.forEach((x) => {
      const c = byId(d.campaigns, x.id);
      if (c && c.status === "scheduled") audit(d, null, "newsletter.send", c.subject, "Sent on schedule to " + deliver(d, c) + " subscribers");
    });
  });
  return due.length;
}

/** CSV of the list with full addresses: owner's office only, and logged. */
export function exportSubscribersCsv(s: Session | null) {
  let csv = "";
  update((d) => {
    assertCan(d, s, "subscribers.export");
    // Quote every cell, and defuse a leading = + - @ so a spreadsheet does not run it as a formula.
    const esc = (v: string) => '"' + String(v).replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"';
    const rows = (d.subscribers || []).map((x) => [x.email, x.status, x.branches.join(" "), x.topics.join(" "), x.source, x.createdAt, x.confirmedAt || ""].map(esc).join(","));
    csv = ["email,status,stores,topics,source,signed_up,confirmed", ...rows].join("\n");
    audit(d, s, "subscribers.export", "Mailing list", "Exported " + rows.length + " rows with full addresses");
  });
  return csv;
}
