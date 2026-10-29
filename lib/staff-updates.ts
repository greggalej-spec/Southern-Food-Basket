import { assertCan, can, scopeOf } from "./access";
import { mail } from "./newsletter";
import { audit, byId, differs, load, nowIso, uid, update } from "./store";
import type { Employee, Seed, Session, StaffUpdate } from "./types";

/* Staff updates: the internal newsletter. The office writes one, picks stores and teams, and it is e-mailed to each
   person's work address and kept in their portal (/portal/updates). It never touches the shoppers' list, and the
   shoppers' newsletter never reaches staff through this.

   Access rules the screens rely on:
   - writing and sending needs "staff.updates" (HR, store admin, the owner's office);
   - a sender whose access covers some stores can only pick those stores, and only sees updates aimed inside them;
   - a person sees an update only if they were on it when it was sent, and only they can mark it read or confirmed. */

export const LIMITS = { subject: 120, summary: 160, body: 4000 } as const;

export const UPDATE_STATE: Record<StaffUpdate["status"], { label: string; tone: "info" | "warn" | "ok" }> = {
  draft: { label: "Draft", tone: "info" },
  scheduled: { label: "Scheduled", tone: "warn" },
  sent: { label: "Sent", tone: "ok" },
};

/** The teams (departments) staff belong to, for the audience picker. */
export function teamsOf(d: Seed) {
  return Array.from(new Set((d.employees || []).map((e) => e.dept))).sort((a, b) => a.localeCompare(b));
}

/** Who an audience reaches right now. */
export function staffAudience(d: Seed, a: StaffUpdate["audience"]): Employee[] {
  return (d.employees || []).filter((e) => (!a.branches || a.branches.includes(e.branchId)) && (!a.teams || a.teams.includes(e.dept)));
}

/** Whether an audience sits inside a sender's stores. A sender with every store may pick anything. */
function withinScope(scope: string[] | null, a: StaffUpdate["audience"]) {
  if (!scope) return true;
  return !!a.branches && a.branches.length > 0 && a.branches.every((b) => scope.includes(b));
}

/** The updates a sender may see and work on: all of them with every store, else those aimed inside their stores. */
export function updatesForSender(d: Seed, s: Session | null) {
  if (!can(d, s, "staff.updates")) return [];
  const scope = scopeOf(d, s);
  return (d.staffUpdates || []).filter((u) => withinScope(scope, u.audience));
}

/** Paragraphs from the composer's text box: a blank line starts a new one. */
export function paragraphs(text: string) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export type StaffUpdateDraft = Pick<StaffUpdate, "subject" | "summary" | "body" | "needsAck" | "audience">;

function check(d: Seed, s: Session | null, draft: StaffUpdateDraft) {
  assertCan(d, s, "staff.updates");
  const subject = draft.subject.trim();
  if (!subject) throw new Error("Give the update a subject.");
  if (subject.length > LIMITS.subject) throw new Error("Keep the subject under " + LIMITS.subject + " characters.");
  if (draft.summary.trim().length > LIMITS.summary) throw new Error("Keep the summary under " + LIMITS.summary + " characters.");
  if (!draft.body.length) throw new Error("Write the update before saving it.");
  if (draft.body.join("\n\n").length > LIMITS.body) throw new Error("Keep the update under " + LIMITS.body + " characters.");
  const scope = scopeOf(d, s);
  if (!withinScope(scope, draft.audience)) throw new Error("Your access covers only some stores. Pick from those stores.");
  if (draft.audience.branches && !draft.audience.branches.length) throw new Error("Pick at least one store.");
  if (draft.audience.teams && !draft.audience.teams.length) throw new Error("Pick at least one team.");
}

/** The update, if this sender may work on it; otherwise an error worded for the screen. */
function mine(d: Seed, s: Session | null, id: string) {
  const u = byId(d.staffUpdates, id);
  if (!u || !withinScope(scopeOf(d, s), u.audience)) throw new Error("That update is not in your stores.");
  return u;
}

export function saveStaffUpdate(s: Session | null, id: string | null, draft: StaffUpdateDraft) {
  let savedId = "";
  update((d) => {
    check(d, s, draft);
    const clean = { ...draft, subject: draft.subject.trim(), summary: draft.summary.trim() };
    if (id) {
      const u = mine(d, s, id);
      if (u.status === "sent") throw new Error("A sent update cannot be changed. Write a new one.");
      const changed = differs(u, clean);
      Object.assign(u, clean);
      savedId = u.id;
      if (changed) audit(d, s, "staffnews.edit", u.subject, "Edited");
    } else {
      const u: StaffUpdate = { ...clean, id: uid("su"), status: "draft", reads: [], acks: [], createdBy: s!.userId!, createdAt: nowIso(), testSends: [] };
      d.staffUpdates = [u, ...(d.staffUpdates || [])];
      savedId = u.id;
      audit(d, s, "staffnews.create", u.subject, "Drafted");
    }
  });
  return savedId;
}

function letter(u: StaffUpdate) {
  return [u.summary, ...u.body].filter(Boolean);
}

function action(u: StaffUpdate) {
  return { label: u.needsAck ? "Read it and confirm in your staff portal" : "Read it in your staff portal", href: "/portal/updates#" + u.id };
}

/** A test goes only to the sender's own work address. */
export function sendStaffTest(s: Session | null, id: string) {
  let to = "";
  update((d) => {
    assertCan(d, s, "staff.updates");
    const u = mine(d, s, id);
    const me = byId(d.employees, s?.userId);
    if (!me) throw new Error("Your staff record was not found.");
    to = me.email;
    u.testSends = [{ at: nowIso(), to }, ...u.testSends];
    mail(d, { to, kind: "internal", subject: "[Test] " + u.subject, body: letter(u), action: action(u), staffUpdateId: u.id });
    audit(d, s, "staffnews.test", u.subject, "Test sent to own work address");
  });
  return to;
}

export function scheduleStaffUpdate(s: Session | null, id: string, at: string | null) {
  update((d) => {
    assertCan(d, s, "staff.updates");
    const u = mine(d, s, id);
    if (u.status === "sent") return;
    if (at && new Date(at).getTime() <= Date.now()) throw new Error("Pick a time in the future, or send it now.");
    if (at && !staffAudience(d, u.audience).length) throw new Error("Nobody matches those stores and teams.");
    u.status = at ? "scheduled" : "draft";
    u.scheduledFor = at || undefined;
    audit(d, s, at ? "staffnews.schedule" : "staffnews.unschedule", u.subject, at ? "Scheduled" : "Back to draft");
  });
}

function deliver(d: Seed, u: StaffUpdate, by: string | null) {
  const people = staffAudience(d, u.audience);
  people.forEach((e) => mail(d, { to: e.email, kind: "internal", subject: u.subject, body: letter(u), action: action(u), staffUpdateId: u.id }));
  u.status = "sent";
  u.sentAt = nowIso();
  u.sentBy = by || u.createdBy;
  u.scheduledFor = undefined;
  u.recipientIds = people.map((e) => e.id);
  return people.length;
}

export function sendStaffUpdateNow(s: Session | null, id: string) {
  let n = 0;
  update((d) => {
    assertCan(d, s, "staff.updates");
    const u = mine(d, s, id);
    if (u.status === "sent") return;
    if (!staffAudience(d, u.audience).length) throw new Error("Nobody matches those stores and teams.");
    n = deliver(d, u, s?.userId || null);
    audit(d, s, "staffnews.send", u.subject, "Sent to " + n + " staff");
  });
  return n;
}

/** E-mails the update again to the people it was sent to who have not opened it, or not confirmed it when it asks
 *  them to. Nobody else hears about it. */
export function remindStaffUpdate(s: Session | null, id: string) {
  let n = 0;
  update((d) => {
    assertCan(d, s, "staff.updates");
    const u = mine(d, s, id);
    if (u.status !== "sent") return;
    const r = receipts(d, u);
    const people = u.needsAck ? r.unconfirmed : r.unread;
    people.forEach((e) => mail(d, { to: e.email, kind: "internal", subject: "[Reminder] " + u.subject, body: letter(u), action: action(u), staffUpdateId: u.id }));
    n = people.length;
    if (n) audit(d, s, "staffnews.remind", u.subject, "Reminder sent to " + n + " staff");
  });
  return n;
}

/** Sends scheduled updates whose time has come. The screens call it when they open; in production a scheduled job
 *  does. */
export function sendDueStaffUpdates(now = Date.now()) {
  const due = (load().staffUpdates || []).filter((u) => u.status === "scheduled" && u.scheduledFor && new Date(u.scheduledFor).getTime() <= now);
  if (!due.length) return 0;
  update((d) => {
    due.forEach((x) => {
      const u = byId(d.staffUpdates, x.id);
      if (u && u.status === "scheduled") audit(d, null, "staffnews.send", u.subject, "Sent on schedule to " + deliver(d, u, null) + " staff");
    });
  });
  return due.length;
}

/* the reader's side */

/** The updates one person was sent, newest first. */
export function updatesFor(d: Seed, employeeId: string) {
  return (d.staffUpdates || [])
    .filter((u) => u.status === "sent" && (u.recipientIds || []).includes(employeeId))
    .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
}

export const hasRead = (u: StaffUpdate, employeeId: string) => u.reads.some((r) => r.employeeId === employeeId);
export const hasAcked = (u: StaffUpdate, employeeId: string) => u.acks.some((r) => r.employeeId === employeeId);

/** What still needs this person: unread, or waiting for their confirmation. */
export function waitingFor(d: Seed, employeeId: string) {
  return updatesFor(d, employeeId).filter((u) => !hasRead(u, employeeId) || (u.needsAck && !hasAcked(u, employeeId)));
}

function own(d: Seed, s: Session | null, id: string) {
  assertCan(d, s, "portal.self");
  const u = byId(d.staffUpdates, id);
  const me = s?.userId || "";
  if (!u || u.status !== "sent" || !(u.recipientIds || []).includes(me)) throw new Error("That update was not sent to you.");
  return { u, me };
}

/** Opening an update marks it read, once. */
export function markStaffUpdateRead(s: Session | null, id: string) {
  const d0 = load();
  const u0 = byId(d0.staffUpdates, id);
  if (!u0 || !s?.userId || hasRead(u0, s.userId)) return;
  update((d) => {
    const { u, me } = own(d, s, id);
    if (!hasRead(u, me)) u.reads = [...u.reads, { employeeId: me, at: nowIso() }];
  });
}

/** "I have read this", on updates that ask for it. Logged, because it is the record that someone was told. */
export function acknowledgeStaffUpdate(s: Session | null, id: string) {
  update((d) => {
    const { u, me } = own(d, s, id);
    if (!u.needsAck || hasAcked(u, me)) return;
    const at = nowIso();
    if (!hasRead(u, me)) u.reads = [...u.reads, { employeeId: me, at }];
    u.acks = [...u.acks, { employeeId: me, at }];
    audit(d, s, "staffnews.ack", u.subject, "Confirmed as read");
  });
}

/** Read and confirmed counts for a sent update, and who has not confirmed yet. */
export function receipts(d: Seed, u: StaffUpdate) {
  const ids = u.recipientIds || [];
  const people = ids.map((id) => byId(d.employees, id)).filter((e): e is Employee => !!e);
  const read = people.filter((e) => hasRead(u, e.id));
  const acked = people.filter((e) => hasAcked(u, e.id));
  const unread = people.filter((e) => !hasRead(u, e.id));
  const unconfirmed = u.needsAck ? people.filter((e) => !hasAcked(u, e.id)) : [];
  return { total: people.length, read: read.length, acked: acked.length, unread, unconfirmed };
}
