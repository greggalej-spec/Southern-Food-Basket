import { assertCan } from "@/lib/access";
import { mail } from "@/lib/newsletter";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { CommunityRequest, FileMeta, RequestKind, RequestStatus, Seed, Session, Tone } from "@/lib/types";

/* Partnership, promotion and donation requests. Schools, charities, clubs and companies ask through the form on
   /community; letters, WhatsApp messages and walk-ins are logged by the office into the same list. Each request moves
   along one pipeline, carries its own message thread (notes for staff, replies to the requester), and only the
   director's office can say yes or no. Every write checks access and is audited. */

export const KIND: Record<RequestKind, { label: string; hint: string }> = {
  donation: { label: "Donation", hint: "Goods or hampers for a school, charity or community event" },
  sponsorship: { label: "Sponsorship", hint: "Money or prizes in return for the store’s name on an event or team" },
  partnership: { label: "Partnership", hint: "Working together over time: a screening day, a school programme, a drive" },
  promotion: { label: "In-store promotion", hint: "A company’s display, sampling or giveaway in the stores" },
};

export const KINDS = Object.keys(KIND) as RequestKind[];

/** The pipeline, in order. approved and declined share the "decided" step; done closes an approved request. */
export const STAGES: { id: RequestStatus; label: string; tone: Tone; explain: string }[] = [
  { id: "new", label: "New", tone: "info", explain: "Just in. Nobody has picked it up yet." },
  { id: "reviewing", label: "Being looked at", tone: "plain", explain: "The office is getting details or checking with a store." },
  { id: "with-owner", label: "With the director", tone: "warn", explain: "Waiting for a yes or a no." },
  { id: "approved", label: "Approved", tone: "ok", explain: "Agreed. Still to be handed over or held." },
  { id: "declined", label: "Declined", tone: "bad", explain: "Answered with a no." },
  { id: "done", label: "Done", tone: "plain", explain: "Handed over, held or finished." },
];

export const stage = (id: RequestStatus) => STAGES.find((x) => x.id === id) || STAGES[0];
export const isOpen = (r: CommunityRequest) => r.status !== "declined" && r.status !== "done";

export const ORG_TYPES = ["Primary school", "Secondary school", "Charity", "Religious body", "Sports club", "Community group", "Supplier", "Other"];
export const VIAS: CommunityRequest["via"][] = ["Letter", "WhatsApp", "E-mail", "Walk-in", "Website"];

function nextRef(d: Seed) {
  const max = (d.requests || []).reduce((n, r) => Math.max(n, Number(String(r.ref).replace(/\D/g, "")) || 0), 140);
  return "RQ-" + String(max + 1).padStart(4, "0");
}

export type RequestForm = Pick<CommunityRequest, "kind" | "org" | "orgType" | "contact" | "phone" | "email" | "branchId" | "ask" | "purpose" | "neededBy">;

/** The public form on /community. No sign-in: it adds the request and "sends" an acknowledgement to the demo
 *  outbox. Returns the reference the requester is shown. */
export function submitRequest(form: RequestForm) {
  let ref = "";
  update((d) => {
    ref = nextRef(d);
    const today = nowIso().slice(0, 10);
    d.requests = [{ id: uid("rq"), ref, via: "Website", receivedAt: today, status: "new", messages: [], ...form }, ...(d.requests || [])];
    if (form.email) {
      mail(d, {
        to: form.email, kind: "transactional", subject: "We have your request (" + ref + ")",
        body: ["Thank you for writing to Southern Food Basket.", "Your request is with our office. We read every one and reply within ten working days.", "If you call us about it, quote " + ref + "."],
      });
    }
    audit(d, null, "requests.submit", ref + " " + form.org, "Came in through the website form");
  });
  return ref;
}

/** A request the office logs itself: a letter, a WhatsApp message, someone at the customer service desk. */
export function logRequest(s: Session | null, form: RequestForm & { via: CommunityRequest["via"]; receivedAt: string; letter?: FileMeta }) {
  let id = "";
  update((d) => {
    assertCan(d, s, "requests.log");
    id = uid("rq");
    const ref = nextRef(d);
    d.requests = [{ id, ref, status: "new", owner: s?.userId || undefined, messages: [], ...form }, ...(d.requests || [])];
    audit(d, s, "requests.log", ref + " " + form.org, "Logged a request that came by " + form.via.toLowerCase());
  });
  return id;
}

function find(d: Seed, id: string) {
  const r = byId(d.requests, id);
  if (!r) throw new Error("That request is no longer there.");
  return r;
}

const title = (r: CommunityRequest) => r.ref + " " + r.org;

/** Moves a request along. Saying yes or no is decide(); this covers the steps either side of it. */
export function moveRequest(s: Session | null, id: string, to: "reviewing" | "with-owner" | "done" | "new") {
  update((d) => {
    assertCan(d, s, "requests.log");
    const r = find(d, id);
    if (to === "done" && r.status !== "approved") throw new Error("Only an approved request can be marked done.");
    r.status = to;
    if (to === "done") r.doneAt = nowIso();
    if (!r.owner && s?.userId) r.owner = s.userId;
    r.messages.push({ at: nowIso(), by: s?.userId || "", kind: "internal", text: to === "with-owner" ? "Sent to the director for a decision." : to === "done" ? "Marked done." : to === "reviewing" ? "Picked up." : "Moved back to new." });
    audit(d, s, "requests.move", title(r), "Moved to " + stage(to).label.toLowerCase());
  });
}

export function decideRequest(s: Session | null, id: string, approve: boolean, detail: { give?: string; value?: number; note: string }) {
  update((d) => {
    assertCan(d, s, "requests.decide");
    const r = find(d, id);
    r.status = approve ? "approved" : "declined";
    r.decidedBy = s?.userId || "";
    r.decidedAt = nowIso();
    r.decisionNote = detail.note;
    if (approve) {
      r.give = detail.give || r.ask;
      r.value = detail.value;
    }
    r.messages.push({ at: nowIso(), by: s?.userId || "", kind: "internal", text: (approve ? "Approved" + (detail.give ? ": " + detail.give : "") + "." : "Declined.") + (detail.note ? " " + detail.note : "") });
    audit(d, s, "requests.decide", title(r), approve ? "Approved" + (detail.give ? ": " + detail.give : "") : "Declined");
  });
}

/** Adds to the thread. An internal note stays with staff. A reply goes to the requester's e-mail (the demo outbox)
 *  when there is one, and is kept on the thread either way. "inbound" records what they said back. */
export function addRequestMessage(s: Session | null, id: string, kind: "internal" | "outbound" | "inbound", text: string) {
  update((d) => {
    assertCan(d, s, "requests.log");
    const r = find(d, id);
    r.messages.push({ at: nowIso(), by: kind === "inbound" ? "requester" : s?.userId || "", kind, text });
    if (kind === "outbound" && r.email) mail(d, { to: r.email, kind: "transactional", subject: "Your request to Southern Food Basket (" + r.ref + ")", body: [text] });
    audit(d, s, "requests.message", title(r), kind === "internal" ? "Added a note" : kind === "outbound" ? "Replied to the requester" : "Recorded their reply");
  });
}

export function assignRequest(s: Session | null, id: string, owner: string) {
  update((d) => {
    assertCan(d, s, "requests.log");
    const r = find(d, id);
    r.owner = owner || undefined;
    audit(d, s, "requests.assign", title(r), owner ? "Given to " + (byId(d.employees, owner)?.name || "someone") : "Left with nobody");
  });
}

/** Counts for the pipeline strip and the owner's overview. */
export function requestCounts(d: Seed) {
  const list = d.requests || [];
  const by = (st: RequestStatus) => list.filter((r) => r.status === st).length;
  const year = String(new Date().getFullYear());
  const given = list.filter((r) => (r.status === "approved" || r.status === "done") && String(r.decidedAt || "").startsWith(year));
  return { new: by("new"), reviewing: by("reviewing"), withOwner: by("with-owner"), approved: by("approved"), declined: by("declined"), done: by("done"), open: list.filter(isOpen).length, valueThisYear: given.reduce((n, r) => n + (r.value || 0), 0), agreedThisYear: given.length };
}
